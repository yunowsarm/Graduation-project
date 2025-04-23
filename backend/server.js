const express = require("express");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer");
const Minio = require("minio");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { Server } = require("socket.io");
const port = 3001;
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "MyDatabase";
const http = require("http");
const AK = "KrdtzVJRJqWefTMmBMqldw34";
const SK = "rm52JnrpZbJymRYm88qByNkK9cEuqrbF";
const server = http.createServer(app);
const OpenAI = require("openai");
const axios = require("axios");
const AIClient = new OpenAI({
  apiKey: "sk-05QMvvNQIFHT4Wrg1o7VyN27LgXnezLP9O1qAQ0VkRd9BIir",
  baseURL: "https://api.moonshot.cn/v1",
});

const systemMessages = [
  {
    role: "system",
    content:
      "你是有很有文采的人工智能,你更擅长中文和英文的对话。你会为用户提供优美有文采,有帮助,准确的回答。同时,你会拒绝一切涉及恐怖主义,种族歧视,黄色暴力的回答。",
  },
];

let messages = [];

async function makeMessages(userId, content, n = 30) {
  // 1. 获取该用户的聊天记录
  const chatHistory = await AIChatHistoryCollection.findOne({ userId });
  messages = chatHistory ? chatHistory.messages : [];

  // 2. 记录当前用户输入
  messages.push({ role: "user", content });

  // 3. 保持消息条数不超过 `n`
  if (messages.length > n) {
    messages = messages.slice(-n);
  }

  // 4. 添加 systemMessages
  let newMessages = systemMessages.concat(messages);
  return newMessages;
}

async function chat(userId, content, onChunk) {
  // 获取 AI 响应，开启流式响应
  const stream = await AIClient.chat.completions.create({
    model: "moonshot-v1-32k",
    messages: await makeMessages(userId, content),
    temperature: 0.3,
    stream: true, // 开启流式响应
  });

  let fullResponse = "";

  // 遍历流式响应中的每个 chunk
  for await (const chunk of stream) {
    // 根据实际返回数据格式，解析 chunk，这里假设数据格式为：
    // chunk = { choices: [ { delta: { content: "本次返回的内容" } } ] }
    const delta = chunk.choices[0].delta;
    if (delta && delta.content) {
      // 累积完整回复
      fullResponse += delta.content;
      // 通过回调函数实时输出本次收到的内容
      onChunk(delta.content);
    }
  }

  // 将 AI 的完整回复添加到消息记录中
  messages.push({ role: "assistant", content: fullResponse });

  // 存入数据库，更新该用户的聊天记录
  await AIChatHistoryCollection.updateOne(
    { userId: userId },
    { $set: { messages: messages } },
    { upsert: true }
  );

  return fullResponse;
}

// 初始化 Socket.IO 服务
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost:")) {
        callback(null, true);
      } else {
        callback(new Error("跨域未解决"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// 保存在线用户的 socket 映射（用户ID => socket 实例）
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("用户连接, socket id:", socket.id);
  // 客户端连接后需发送注册事件以传入用户ID
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket;
  });

  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("sendMessage", (message) => {
    const { conversationId } = message;
    if (conversationId) {
      // 向房间内的其他客户端广播新消息
      // 注意：socket.to(...).emit() 会将消息发给除了当前发送者以外的所有人
      socket.to(conversationId).emit("newMessage", message);
    }
  });

  socket.on("markMessageAsRead", ({ conversationId, userId }) => {
    // 广播给会话房间内除当前用户之外的其他用户，通知他们该会话的消息已被阅读
    socket.emit("messageRead", { conversationId, userId });
  });

  socket.on("disconnect", () => {
    // 清理断开连接的 socket
    for (const [userId, s] of Object.entries(onlineUsers)) {
      if (s.id === socket.id) {
        delete onlineUsers[userId];
        break;
      }
    }
    console.log("socket 断开:", socket.id);
  });
});

// 配置 Multer（用于处理文件上传）
const upload = multer({
  storage: multer.memoryStorage(), // 将文件保存在内存中，便于上传到 MinIO
});

const minioClient = new Minio.Client({
  endPoint: "127.0.0.1",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: "password",
});

// 全局变量
let db;
let postsCollection;
let usersCollection;
let commentsCollection;
let notificationsCollection;
let conversationsCollection;
let messagesCollection;
let AIChatHistoryCollection;
const JWT_SECRET = "Y75BHDXnkAUirklJuOmXDaUG6dPJkbAE";

// 连接数据库
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db(dbName);
    postsCollection = db.collection("Posts");
    usersCollection = db.collection("Users");
    commentsCollection = db.collection("Comments");
    notificationsCollection = db.collection("Notifications");
    conversationsCollection = db.collection("Conversations");
    messagesCollection = db.collection("Messages");
    AIChatHistoryCollection = db.collection("AIChatHistory");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// 验证令牌中间件
function authenticateToken(req, res, next) {
  const token = req.cookies.token; // 从 Cookie 中获取令牌
  if (!token) {
    return res.status(401).json({ message: "未提供令牌" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "令牌无效" });
    }

    req.user = user; // 将解码后的用户信息存入请求对象
    next();
  });
}

// 中间件
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith("http://localhost:")) {
        callback(null, true); // 允许所有 localhost 端口
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser()); // 解析 Cookie
app.use(express.json()); // 解析 JSON

app.post("/api/chat", authenticateToken, async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id; // 从请求对象中获取用户ID

  if (!content) {
    return res.status(400).json({ error: "缺少 content 参数" });
  }

  // 设置 SSE 响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // 调用 chat 并传入 onChunk 回调，将每个 chunk 实时写入响应流
    await chat(userId, content, (chunk) => {
      res.write(chunk);
    });
  } catch (error) {
    console.error("调用 AI 接口时出错：", error);
    res.write(`data: 错误：${error.message}\n\n`);
  } finally {
    res.end();
  }
});

async function getAccessToken() {
  const options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" +
      AK +
      "&client_secret=" +
      SK,
  };
  const res = await axios(options);
  return res.data.access_token;
}

// 与 getAccessToken 功能相同，也可直接调用 getAccessToken
async function getUrlToken() {
  return await getAccessToken();
}

// 提交绘画任务并返回任务生成的图片 URL
async function drawByAI(prompt) {
  // 提交任务
  const accessToken = await getAccessToken();
  const submitOptions = {
    method: "POST",
    url:
      "https://aip.baidubce.com/rpc/2.0/wenxin/v1/extreme/textToImage?access_token=" +
      accessToken,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: {
      prompt,
      width: 512,
      height: 512,
    },
  };

  const submitResponse = await axios(submitOptions);
  const task_id = submitResponse.data.data.task_id;
  if (!task_id) {
    throw new Error("任务提交失败，没有返回 task_id");
  }
  // 等待5秒后查询图片
  await new Promise((resolve) => setTimeout(resolve, 5000));
  const imgUrl = await getImgUrl(task_id);
  return imgUrl;
}

// 根据 task_id 获取图片 URL
async function getImgUrl(task_id) {
  const token = await getUrlToken();
  let response;
  const options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/rpc/2.0/wenxin/v1/extreme/getImg?access_token=" +
      token,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: {
      task_id,
    },
  };

  response = await axios(options);
  // {
  //   data: {
  //     sub_task_result_list: [
  //       {
  //         final_image_list: [
  //           { img_url: "图片地址" }
  //         ],
  //         sub_task_status: "SUCCESS" // 或其他状态
  //       }
  //     ]
  //   },
  //   log_id: ...
  // }
  const subTasks = response.data.data.sub_task_result_list;
  if (subTasks && subTasks.length > 0) {
    const finalImageList = subTasks[0].final_image_list;
    if (finalImageList && finalImageList.length > 0) {
      return finalImageList[0].img_url;
    }
  } else {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    response = await axios(options); // 再次请求
    const subTasks = response.data.data.sub_task_result_list;
    if (subTasks && subTasks.length > 0) {
      const finalImageList = subTasks[0].final_image_list;
      if (finalImageList && finalImageList.length > 0) {
        return finalImageList[0].img_url;
      } else {
        throw new Error("超时没有返回图片地址");
      }
    }
  }
}

// Express 路由示例
app.post("/api/draw", async (req, res) => {
  const { prompt } = req.body;
  try {
    const url = await drawByAI(prompt);
    res.status(200).json({ url });
  } catch (error) {
    console.error("调用 AI 接口时出错：", error);
    res.status(500).json({ error: "调用 AI 接口时出错" });
  }
});

//* 代理请求百度 AI 图片,用于给前端下载图片
app.get("/api/proxy-image", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "缺少图片 URL" });

    // 请求百度 AI 图片
    const response = await axios.get(url, { responseType: "arraybuffer" });

    // 读取 Content-Type 头
    const contentType = response.headers["content-type"];

    // 设置响应头，转发图片数据
    res.setHeader("Content-Type", contentType);
    res.send(response.data);
  } catch (error) {
    console.error("代理请求失败:", error);
    res.status(500).json({ error: "图片代理请求失败" });
  }
});

//* 用户注册存入数据库
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "所有字段都是必填的" });
  }

  try {
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "该邮箱已被注册" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      username,
      email,
      password: hashedPassword,
      avatar: "/DefaultAvatar.png",
      createdAt: new Date(),
      sign: "",
      following: [],
      fans: [],
      role: "normal",
      state: "active",
    };

    const result = await usersCollection.insertOne(newUser);
    const userId = result.insertedId; // 获取 MongoDB 自动生成的 _id
    await AIChatHistoryCollection.insertOne({
      userId: userId.toString(), // 绑定用户ID
      messages: [], // 初始聊天记录为空
    });

    res.status(201).json({ message: "注册成功" });
  } catch (error) {
    console.error("注册失败:", error);
    res.status(500).json({ message: "服务器错误，注册失败" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "邮箱和密码是必填的" });
  }

  try {
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "用户不存在" });
    }

    // 判断账号是否被冻结
    if (user.state === "frozen") {
      return res.status(403).json({ message: "该账号已被冻结，无法登录" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "密码错误" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "36h" }
    );

    res.cookie("token", token, {
      httpOnly: false,
      secure: false,
      sameSite: "Strict",
      maxAge: 43200000,
    });

    res
      .status(200)
      .json({ message: "登录成功", user: { email, username: user.username } });
  } catch (error) {
    console.error("登录失败:", error);
    res.status(500).json({ message: "服务器错误，登录失败" });
  }
});

//* 用户退出登录
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "Strict",
  });
  res.status(200).json({ message: "已退出登录" });
});

async function getUserInfo(id) {
  const user = await usersCollection.findOne(
    { _id: id },
    { projection: { password: 0 } }
  );

  if (!user) {
    throw new Error("用户信息不存在");
  }

  return user;
}

// !获取当前用户信息
app.get("/user/me", authenticateToken, async (req, res) => {
  try {
    // 使用令牌中解码的用户 ID 查询数据库
    const user = await getUserInfo(new ObjectId(req.user._id));
    // 返回用户信息
    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
      sign: user.sign,
      role: user.role,
      state: user.state,
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// !获取任意用户信息
app.get("/user/originalUser/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    res.status(200).json(user);
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//!获取所有用户信息除了Admin
app.get("/user/allUsers", async (req, res) => {
  try {
    const users = await usersCollection
      .find({ role: { $ne: "manager" } })
      .toArray();
    const sanitizedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username || "",
      email: user.email || "",
      state: user.state || "未知",
      role: user.role || "normal",
    }));

    res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//!获取用户帖子数量
app.get("/user/postCount/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const postCount = await postsCollection.countDocuments({
      author: new ObjectId(userId),
    });
    res.status(200).json({ postCount });
  } catch (error) {
    console.error("获取用户帖子数量失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//!冻结用户
app.put("/user/freeze/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { state: "frozen" } }
    );
    res.status(200).json({ message: "用户已冻结" });
  } catch (error) {
    console.error("冻结用户失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//!解冻用户
app.put("/user/unfreeze/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { state: "active" } }
    );
    res.status(200).json({ message: "用户已解冻" });
  } catch (error) {
    console.error("解冻用户失败:", error);
  }
});

//!删除用户
app.delete("/user/delete/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }
    await usersCollection.deleteOne({ _id: new ObjectId(userId) });
    res.status(200).json({ message: "用户已删除" });
  } catch (error) {
    console.error("删除用户失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *更新用户信息
app.put("/user/update", authenticateToken, async (req, res) => {
  try {
    const { username, sign, avatar } = req.body;
    const email = req.user.email; // 从 token 中获取用户邮箱
    const updateFields = {};
    if (username) updateFields.username = username;
    if (sign) updateFields.sign = sign;
    if (avatar) updateFields.avatar = avatar;

    // 更新数据库中的用户信息
    const result = await usersCollection.updateOne(
      { email },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: "没有更改任何信息" });
    }

    res.status(200).json({ message: "用户信息更新成功" });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *获取当前用户所有帖子
app.get("/user/ownPosts", authenticateToken, async (req, res) => {
  try {
    const userID = new ObjectId(req.user._id);

    // 查询用户的所有帖子，按创建时间降序排序
    const userPosts = await postsCollection
      .find({ author: userID })
      .sort({ createdAt: -1 }) // 最新的帖子排在前面
      .toArray();
    if (!userPosts.length) {
      return res.status(200).json({
        message: "没有找到您的帖子",
        posts: [],
      });
    }
    const enrichedPosts = await Promise.all(
      userPosts.map(async (post) => {
        const user = await usersCollection.findOne(
          { _id: post.author },
          { projection: { avatar: 1, username: 1, email: 1, createdAt: 1 } }
        );
        if (post.isForwarded) {
          const originalPostUser = await usersCollection.findOne(
            { _id: post.originalPostAuthor },
            { projection: { avatar: 1, username: 1, email: 1, createdAt: 1 } }
          );
          return {
            ...post, //包含了originalPost(旧帖子的相关内容)/content(新帖子的内容)/author(新帖子的作者),createdAt(新帖子创立时间)
            originalPostAvatar: originalPostUser?.avatar || "未知用户",
            originalPostName: originalPostUser?.username || "未知用户",
            originalPostEmail: originalPostUser?.email || "未知用户",
            originalPostCreatedAt: originalPostUser?.createdAt || "未知时间",
            avatar: user?.avatar || "未知用户", //新帖子的作者头像
            name: user?.username || "未知用户", //新帖子的作者用户名
            email: user?.email || "未知用户", //新帖子的作者邮箱
            userCreatedAt: user?.createdAt || "未知时间",
          };
        } else {
          return {
            ...post,
            avatar: user?.avatar || "未知用户",
            name: user?.username || "未知用户",
            email: user?.email || "未知用户",
            userCreatedAt: user?.createdAt || "未知时间",
          };
        }
      })
    );
    // 返回用户的帖子数据
    res.status(200).json({
      message: "获取用户帖子成功",
      posts: enrichedPosts,
    });
  } catch (error) {
    console.error("获取用户帖子失败:", error);
    res.status(500).json({
      message: "服务器错误，无法获取您的帖子",
    });
  }
});

app.get("/user/likePosts", authenticateToken, async (req, res) => {
  try {
    const userID = req.user._id.toString();

    const userPosts = await postsCollection
      .find({ loveNum: { $in: [userID] } })
      .sort({ createdAt: -1 })
      .toArray();

    if (!userPosts.length) {
      return res.status(200).json({
        message: "没有找到您喜欢的帖子",
        posts: [],
      });
    }

    const enrichedPosts = await Promise.all(
      userPosts.map(async (post) => {
        const user = await usersCollection.findOne(
          { _id: post.author },
          {
            projection: {
              avatar: 1,
              username: 1,
              email: 1,
              createdAt: 1,
              state: 1,
            },
          }
        );

        // 如果作者不存在或被冻结，则跳过该帖子
        if (!user || user.state === "frozen") return null;

        if (post.isForwarded) {
          const originalPostUser = await usersCollection.findOne(
            { _id: post.originalPostAuthor },
            {
              projection: {
                avatar: 1,
                username: 1,
                email: 1,
                createdAt: 1,
                state: 1,
              },
            }
          );

          // 如果原帖作者不存在或被冻结，也跳过
          if (!originalPostUser || originalPostUser.state === "frozen")
            return null;

          return {
            ...post,
            originalPostAvatar: originalPostUser.avatar,
            originalPostName: originalPostUser.username,
            originalPostEmail: originalPostUser.email,
            originalPostCreatedAt: originalPostUser.createdAt,
            originalPostUserId: originalPostUser._id,

            avatar: user.avatar,
            name: user.username,
            email: user.email,
            userCreatedAt: user.createdAt,
            userId: user._id,
          };
        } else {
          return {
            ...post,
            avatar: user.avatar,
            name: user.username,
            email: user.email,
            userCreatedAt: user.createdAt,
            userId: user._id,
          };
        }
      })
    );

    // 过滤掉为 null 的帖子
    const filteredPosts = enrichedPosts.filter(Boolean);

    res.status(200).json({
      message: "获取用户帖子成功",
      posts: filteredPosts,
    });
  } catch (error) {
    console.error("获取用户帖子失败:", error);
    res.status(500).json({
      message: "服务器错误，无法获取您的帖子",
    });
  }
});

app.get("/user/follows", authenticateToken, async (req, res) => {
  try {
    const userID = req.user._id;
    const user = await usersCollection.findOne({ _id: new ObjectId(userID) });

    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const follows = user.following; // 获取关注列表（用户ID数组）

    // 查询所有关注的用户详细信息
    const followedUsers = await Promise.all(
      follows.map(async (followedId) => {
        return await usersCollection.findOne(
          { _id: new ObjectId(followedId) },
          { projection: { password: 0 } } // 可选：排除敏感字段，如密码
        );
      })
    );

    res.status(200).json({
      message: "获取用户关注成功",
      follows: followedUsers,
    });
  } catch (error) {
    console.error("获取用户关注失败:", error);
    res.status(500).json({
      message: "服务器错误，无法获取您的关注",
    });
  }
});

//获取某个帖子
app.get("/posts/:postId", async (req, res) => {
  try {
    const { postId } = req.params; // 获取URL中的postId参数
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) }); // 根据postId查询帖子

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" }); // 如果找不到帖子，返回404错误
    }

    // 获取作者信息
    const user = await usersCollection.findOne(
      { _id: post.author },
      { projection: { avatar: 1, username: 1, email: 1, createdAt: 1 } }
    );

    // 如果是转发的帖子，获取原始帖子的作者信息
    let enrichedPost = {
      ...post,
      avatar: user?.avatar || "未知用户", // 新帖子的作者头像
      name: user?.username || "未知用户", // 新帖子的作者用户名
      email: user?.email || "未知用户", // 新帖子的作者邮箱
      userCreatedAt: user?.createdAt || "未知时间", // 新帖子的作者注册时间
      userId: user?._id || "未知用户", // 新帖子的作者ID
    };

    if (post.isForwarded) {
      const originalPostUser = await usersCollection.findOne(
        { _id: post.originalPostAuthor },
        { projection: { avatar: 1, username: 1, email: 1, createdAt: 1 } }
      );

      enrichedPost = {
        ...enrichedPost,
        originalPostAvatar: originalPostUser?.avatar || "未知用户", // 原始帖子的作者头像
        originalPostName: originalPostUser?.username || "未知用户", // 原始帖子的作者用户名
        originalPostEmail: originalPostUser?.email || "未知用户", // 原始帖子的作者邮箱
        originalPostCreatedAt: originalPostUser?.createdAt || "未知时间", // 原始帖子的作者注册时间
        originalPostUserId: originalPostUser?._id || "未知用户", // 原始帖子的作者ID
      };
    }

    res.status(200).json({ post: enrichedPost }); // 返回帖子内容
  } catch (err) {
    console.error("获取帖子失败:", err); // 处理错误
    res.status(500).json({ message: "服务器错误" });
  }
});

//*获取所有帖子
app.get("/Content/loadContent", async (req, res) => {
  try {
    const posts = await postsCollection
      .aggregate([
        // 连表查询作者信息（Users 大写）
        {
          $lookup: {
            from: "Users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        { $unwind: "$authorInfo" }, // 拆解数组

        // 过滤掉冻结或不存在作者
        {
          $match: {
            "authorInfo.state": { $ne: "frozen" },
          },
        },

        // 如果是转发帖子，关联原作者信息
        {
          $lookup: {
            from: "Users",
            localField: "originalPostAuthor",
            foreignField: "_id",
            as: "originalAuthorInfo",
          },
        },

        // 如果是转发，检查原帖作者是否存在且未被冻结
        {
          $addFields: {
            isOriginalAuthorValid: {
              $cond: {
                if: { $eq: ["$isForwarded", true] },
                then: {
                  $and: [
                    { $gt: [{ $size: "$originalAuthorInfo" }, 0] },
                    {
                      $ne: [
                        { $arrayElemAt: ["$originalAuthorInfo.state", 0] },
                        "frozen",
                      ],
                    },
                  ],
                },
                else: true,
              },
            },
          },
        },

        { $match: { isOriginalAuthorValid: true } },

        // 整理字段输出
        {
          $project: {
            content: 1,
            url: 1,
            isForwarded: 1,
            createdAt: 1,

            // 新帖作者信息
            author: "$author",
            avatar: "$authorInfo.avatar",
            name: "$authorInfo.username",
            email: "$authorInfo.email",
            userCreatedAt: "$authorInfo.createdAt",
            userId: "$authorInfo._id",

            // 原帖作者信息
            originalPostAuthor: 1,
            originalPost: 1,
            originalPostUrl: 1,
            originalPostAvatar: {
              $arrayElemAt: ["$originalAuthorInfo.avatar", 0],
            },
            originalPostName: {
              $arrayElemAt: ["$originalAuthorInfo.username", 0],
            },
            originalPostEmail: {
              $arrayElemAt: ["$originalAuthorInfo.email", 0],
            },
            originalPostCreatedAt: {
              $arrayElemAt: ["$originalAuthorInfo.createdAt", 0],
            },
            originalPostUserId: {
              $arrayElemAt: ["$originalAuthorInfo._id", 0],
            },
          },
        },
      ])
      .toArray();

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// *上传帖子
app.post("/Content/addContent", authenticateToken, async (req, res) => {
  try {
    const { content, urls } = req.body;

    const user = await getUserInfo(new ObjectId(req.user._id));

    if (!content && !urls) {
      return res.status(400).json({ error: "还什么都没有呢" });
    }

    const newPost = {
      content: content,
      url: urls && urls.length > 0 ? urls : [],
      author: user._id,
      createdAt: new Date(),
      replyNum: 0,
      forwardNum: 0,
      loveNum: [],
      viewNum: 0,
    };

    await postsCollection.insertOne(newPost);
    res.status(201).json({ message: "上传成功" });
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ message: "上传失败" });
  }
});

// *上传文件
app.post("/Content/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(200).json({ message: "没有文件上传" });
  }

  try {
    const bucketName = "img-vedio";
    const uploadedFileUrls = [];

    if (!(await minioClient.bucketExists(bucketName))) {
      await minioClient.makeBucket(bucketName, "us-east-1");
    }

    for (const file of req.files) {
      const objectName = `${Date.now()}-${file.originalname}`;
      await minioClient.putObject(bucketName, objectName, file.buffer, {
        "Content-Type": file.mimetype,
      });
      uploadedFileUrls.push(
        `http://127.0.0.1:9000/${bucketName}/${objectName}`
      );
    }

    res
      .status(200)
      .json({ message: "文件上传成功", fileUrls: uploadedFileUrls });
  } catch (error) {
    console.error("文件上传失败:", error);
    res.status(500).json({ message: "文件上传失败", error: error.message });
  }
});

// *添加评论
app.post("/comments/add", authenticateToken, async (req, res) => {
  try {
    const { postId, content } = req.body;

    // 查询用户信息
    const user = await getUserInfo(new ObjectId(req.user._id));

    // 查询帖子信息
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });

    const postUser = await getUserInfo(new ObjectId(post.author));

    const partContent = content.slice(0, 10);

    if (!post) {
      return res.status(404).json({ message: "帖子不存在" });
    }

    // 创建评论
    const newComment = {
      postId,
      content,
      author: user._id,
      createdAt: new Date(),
      parentCommentId: null, // 如果支持嵌套评论，调整逻辑
      likes: 0,
    };

    // 插入评论
    const insertResult = await commentsCollection.insertOne(newComment);

    // 获取当前帖子的所有评论
    const comments = await commentsCollection
      .find({ postId: postId })
      .sort({ createdAt: -1 })
      .toArray();

    // 更新帖子的 replyNum 字段
    await postsCollection.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { replyNum: comments.length } }
    );

    if (!user) {
      throw new Error("用户信息不存在");
    }
    // 如果评论者不是帖子作者，则发送通知
    // 假设 post.author 为帖子的作者ID
    if (post.author.toString() !== user._id.toString()) {
      await addNotification({
        receiverId: post.author,
        senderId: user._id,
        type: "comment",
        content: `${user.username} 评论了你的帖子:  "${
          content.length > 10 ? content.slice(0, 10) + "..." : content
        }"`,
        postId: postId,
        postUserName: postUser.username,
      });
    }

    // 返回评论数据，附加用户信息
    res.status(201).json({
      comment: {
        ...newComment,
        _id: insertResult.insertedId,
        authorInfo: {
          username: user.username,
          avatar: user.avatar,
          userId: user._id,
          avatar: user.avatar,
          email: user.email,
          fansNum: user.fans.length,
          followNum: user.following.length,
        },
      },
    });
  } catch (error) {
    console.error("添加评论失败:", error);
    res.status(500).json({ message: "服务器错误，添加评论失败" });
  }
});

// *获取选中帖子的所有评论
app.get("/comments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // 获取评论
    const comments = await commentsCollection
      .find({ postId: postId })
      .sort({ createdAt: -1 })
      .toArray();

    if (comments.length === 0) {
      return res.status(200).json([]);
    }

    // 获取所有作者 ID
    const authorIds = [...new Set(comments.map((comment) => comment.author))];

    // 查询用户信息
    const users = await usersCollection
      .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
      .project({
        _id: 1,
        avatar: 1,
        username: 1,
        email: 1,
        fans: 1,
        following: 1,
      })
      .toArray();

    // 构建用户信息 Map
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id.toString()] = {
        avatar: user.avatar,
        username: user.username,
        email: user.email,
        fansNum: user.fans.length,
        followNum: user.following.length,
        userId: user._id,
      };
    });

    // 将评论转换为树状结构
    const commentMap = {};
    comments.forEach((comment) => {
      commentMap[comment._id] = {
        ...comment,
        replies: [],
        authorInfo: userMap[comment.author] || {}, // 添加用户信息
      };
    });

    const result = [];
    comments.forEach((comment) => {
      if (comment.parentCommentId) {
        commentMap[comment.parentCommentId]?.replies.push(
          commentMap[comment._id]
        );
      } else {
        result.push(commentMap[comment._id]);
      }
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("获取评论失败:", error);
    res.status(500).json({ message: "服务器错误，获取评论失败" });
  }
});

// *更新查看次数
app.get("/views/add/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // 更新 viewNum 字段加 1
    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) }, // 查找对应的帖子
      { $inc: { viewNum: 1 } }, // viewNum 加 1
      { returnDocument: "after" } // 返回更新后的文档
    ); // 返回更新后的帖子信息
    res
      .status(200)
      .json({ message: "查看次数更新成功", viewNum: result.viewNum });
  } catch (err) {
    console.error("更新查看次数失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *获取选中帖子的查看次数
app.get("/views/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // 更新 viewNum 字段加 1
    const result = await postsCollection.findOne(
      { _id: new ObjectId(postId) } // 查找对应的帖子
    );
    if (!result) {
      return res.status(201).json({ message: "未找到对应的帖子" });
    }
    res.status(200).json({ message: "查看次数成功", viewNum: result.viewNum });
  } catch (err) {
    console.error("更新查看次数失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *获取选中帖子的喜欢状态
app.get("/liked/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const user_id = req.user._id;

    const result = await postsCollection.findOne(
      { _id: new ObjectId(postId) },
      { projection: { loveNum: 1 } } // 只查询 loveNum 字段
    );

    if (!result) {
      return res.status(201).json({ message: "未找到对应的帖子" });
    }

    const liked = result.loveNum.includes(user_id);

    res.status(200).json({
      message: "查询成功",
      likeNum: result.loveNum.length,
      liked: liked,
    });
  } catch (err) {
    console.error("查询喜欢状态失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *更新点赞次数
app.get("/liked/add/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const user_id = req.user._id;

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) }, // 查找帖子
      { $addToSet: { loveNum: user_id } }, // 确保 user_id 不重复
      { returnDocument: "after", projection: { loveNum: 1, author: 1 } } // 返回更新后的 loveNum
    );
    const user = await getUserInfo(new ObjectId(req.user._id));
    const username = user.username;
    const postUser = await getUserInfo(new ObjectId(result.author));
    if (!result) {
      return res.status(404).json({ message: "未找到对应的帖子" });
    }
    // 如果点赞者不是帖子作者，则添加通知
    if (result.author.toString() !== user_id.toString()) {
      await addNotification({
        receiverId: result.author, // 通知接收者：帖子的作者
        senderId: user_id, // 通知发送者：当前点赞的用户
        type: "like", // 通知类型为点赞
        content: `${username}点赞了你的帖子`, // 通知内容，可根据需要自定义
        postId: postId, // 关联帖子 ID
        postUserName: postUser.username, // 帖子作者的用户名
      });
    }
    res.status(200).json({
      message: "点赞成功",
      likeNum: result.loveNum.length,
    });
  } catch (err) {
    console.error("更新喜欢状态失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *更新取消点赞次数
app.get("/liked/remove/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const user_id = req.user._id;

    const result = await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) }, // 查找帖子
      { $pull: { loveNum: user_id } }, // 移除 user_id
      { returnDocument: "after", projection: { loveNum: 1 } } // 返回更新后的 loveNum
    );
    if (!result) {
      return res.status(404).json({ message: "未找到对应的帖子" });
    }

    res.status(200).json({
      message: "取消点赞成功",
      likeNum: result.loveNum.length,
    });
  } catch (err) {
    console.error("更新喜欢状态失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *转发帖子
app.post("/posts/forward/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const user = await getUserInfo(new ObjectId(req.user._id));

    // 查找原始帖子
    const originalPost = await postsCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!originalPost) {
      return res.status(404).json({ message: "未找到原始帖子" });
    }
    await postsCollection.findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $inc: { forwardNum: 1 } },
      { returnDocument: "after" }
    );
    // 创建新帖子并标记为转发
    const forwardedPost = {
      originalPostContent: originalPost.content, // 原始帖子的内容
      originalPostUrl: originalPost.url, //原始帖子图片
      originalPostId: postId, // 原始帖子 ID
      originalPostAuthor: originalPost.author, // 原始帖子的作者
      originalPostCreatedAt: originalPost.createdAt, // 原始帖子的创建时间
      replyNum: 0,
      forwardNum: 0,
      loveNum: [],
      viewNum: 0,
      content: content, // 转发内容
      author: user._id, // 当前用户为转发者
      createdAt: new Date(),
      isForwarded: true, // 标记为转发
    };

    // 插入新帖子
    const newPost = await postsCollection.insertOne(forwardedPost);
    // 添加通知
    if (forwardedPost.originalPostAuthor.toString() !== user._id.toString()) {
      await addNotification({
        receiverId: forwardedPost.originalPostAuthor, // 通知接收者：帖子的作者
        senderId: user._id, // 通知发送者：当前转发的用户
        type: "forward", // 通知类型为点赞
        content: `${user.username}转发了你的帖子`, // 通知内容，可根据需要自定义
        postId: newPost.insertedId.toString(), // 关联帖子 ID
        postUserName: user.username,
      });
    }

    res.status(201).json({
      message: "转发成功",
    });
  } catch (err) {
    console.error("转发失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});
// *加载转发数量
app.post("/posts/forward/load/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const result = await postsCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!result) {
      return res.status(201).json({ message: "未找到对应的帖子" });
    }

    res.status(200).json({
      message: "转发数量更新成功",
      forwardNum: result.forwardNum,
    });
  } catch (err) {
    console.error("加载转发数量失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

app.delete("/posts/delete/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "无效的帖子ID" });
    }

    const result = await postsCollection.deleteOne({
      _id: new ObjectId(postId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "未找到对应的帖子" });
    }

    res.status(200).json({ message: "帖子删除成功" });
  } catch (err) {
    console.error("删除帖子失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

// *加载深层帖子
const getDeepPosts = async (post, depth = 0) => {
  if (!post.isForwarded) {
    return {
      originalPostContent: post.content,
      originalPostUrl: post.url,
      originalPostId: post._id,
      originalPostAuthor: post.author,
      originalPostCreatedAt: post.createdAt,
      depth: depth,
    };
  } else {
    // 使用 findOne 获取单个文档
    const thisPost = await postsCollection.findOne({
      _id: new ObjectId(post.originalPostId),
    });
    if (!thisPost) throw new Error("无法找到原始帖子");

    // 递归获取深层帖子
    return getDeepPosts(thisPost, depth + 1);
  }
};
// *加载深层帖子
app.get("/posts/forward/deepPosts/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    // 获取初始帖子
    const thisPost = await postsCollection.findOne({
      _id: new ObjectId(postId),
    });
    if (!thisPost) {
      return res.status(404).json({ message: "帖子未找到" });
    }

    // 获取深层帖子数据
    const originalPost = await getDeepPosts(thisPost);

    res.json({ message: "获取深层帖子成功", originalPost });
  } catch (err) {
    console.error("加载转发失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

app.post("/search/searchByPostContent", async (req, res) => {
  const { query } = req.body;
  try {
    const posts = await postsCollection
      .find({ content: { $regex: query, $options: "i" } })
      .toArray();

    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const user = await usersCollection.findOne({
          _id: post.author,
          state: { $ne: "frozen" },
        });

        let originalPostUser = null;
        if (post.isForwarded) {
          originalPostUser = await usersCollection.findOne({
            _id: post.originalPostAuthor,
            state: { $ne: "frozen" },
          });
        }

        if (!user || (post.isForwarded && !originalPostUser)) return null;

        return {
          ...post,
          avatar: user.avatar,
          userId: user._id,
          name: user.username,
          email: user.email,
          userCreatedAt: user.createdAt,
          ...(post.isForwarded && {
            originalPostAvatar: originalPostUser.avatar,
            originalPostName: originalPostUser.username,
            originalPostEmail: originalPostUser.email,
            originalPostCreatedAt: originalPostUser.createdAt,
            originalPostUserId: originalPostUser._id,
          }),
        };
      })
    );

    const filteredPosts = enrichedPosts.filter((p) => p !== null);

    if (filteredPosts.length === 0) {
      return res
        .status(200)
        .json({ message: "未找到匹配的帖子", results: null });
    }

    res.status(200).json({ results: filteredPosts });
  } catch (err) {
    console.error("搜索失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

app.post("/search/searchByUsername", async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "查询参数不能为空" });
  }

  try {
    const users = await usersCollection
      .find({
        username: { $regex: query, $options: "i" },
        state: { $ne: "frozen" },
      })
      .project({ username: 1, email: 1, _id: 1 })
      .limit(10)
      .toArray();

    if (users.length === 0) {
      return res
        .status(200)
        .json({ message: "未找到匹配的用户", results: null });
    }

    res.status(200).json({ results: users });
  } catch (err) {
    console.error("搜索失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

app.post("/search/searchByEmail", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "查询参数不能为空" });
  }

  try {
    const user = await usersCollection.findOne(
      { email: query, state: { $ne: "frozen" } },
      { projection: { username: 1, email: 1, _id: 1 } }
    );

    if (!user) {
      return res
        .status(200)
        .json({ message: "未找到匹配的用户", results: null });
    }

    res.status(200).json({ results: user });
  } catch (err) {
    console.error("搜索失败:", err);
    res.status(500).json({ message: "服务器错误" });
  }
});

//是否在关注列表中
app.get("/follow/isFollowed/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const user = await getUserInfo(new ObjectId(req.user._id));
  const isFollowed = user.following.includes(id);
  res.status(200).json({ isFollowed, currentUserId: user._id });
});

app.post("/follow/addFollow", authenticateToken, async (req, res) => {
  const { userId } = req.body;
  const user = await getUserInfo(new ObjectId(req.user._id));
  if (user.following.includes(userId)) {
    return res.status(200).json({ message: "已经关注" });
  }
  await usersCollection.updateOne(
    { _id: new ObjectId(user._id) },
    { $addToSet: { following: userId } }
  );
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $addToSet: { fans: req.user._id } }
  );
});

app.post("/follow/removeFollow", authenticateToken, async (req, res) => {
  const { userId } = req.body;
  const user = await getUserInfo(new ObjectId(req.user._id));
  if (!user.following.includes(userId)) {
    return res.status(200).json({ message: "未关注" });
  }
  await usersCollection.updateOne(
    { _id: new ObjectId(user._id) },
    { $pull: { following: userId } }
  );
  await usersCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $pull: { fans: req.user._id } }
  );
  return res.status(200).json({ message: "取消关注成功" });
});

//* 获取通知列表接口
app.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await notificationsCollection
      .find({ receiverId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    res.status(200).json(notifications);
  } catch (error) {
    console.error("获取通知失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

app.get("/notifications/unReadCount", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await notificationsCollection.countDocuments({
      receiverId: new ObjectId(userId),
      isRead: false,
    });
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("获取未读通知数量失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//* 标记单个通知为已读
app.post("/notifications/:id/read", authenticateToken, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    await notificationsCollection.updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true } }
    );
    const updatedNotification = await notificationsCollection.findOne({
      _id: new ObjectId(notificationId),
    });
    // 计算未读通知数量
    const unreadCount = await notificationsCollection.countDocuments({
      receiverId: new ObjectId(userId),
      isRead: false,
    });
    const targetSocket = onlineUsers[userId.toString()];
    if (targetSocket) {
      targetSocket.emit("notificationsRead", {
        ...updatedNotification,
        unreadCount,
      });
    }
    res.status(200).json({ message: "已标记为已读" });
  } catch (error) {
    console.error("标记通知为已读失败:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

//*创建会话
app.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    // 这里先检查是否已存在会话（选做）
    let conversation = await conversationsCollection.findOne({
      participants: {
        $all: [new ObjectId(senderId), new ObjectId(receiverId)],
      },
    });

    if (!conversation) {
      // 如果不存在则创建新的会话
      const newConversation = {
        participants: [new ObjectId(senderId), new ObjectId(receiverId)],
        lastMessageAt: new Date(),
      };
      const result = await conversationsCollection.insertOne(newConversation);
      conversation = { ...newConversation, _id: result.insertedId };
    }

    res
      .status(201)
      .json({ conversationId: conversation._id, message: "会话创建成功" });
  } catch (error) {
    console.error("创建会话失败:", error);
    res.status(500).json({ error: "创建会话失败" });
  }
});

//*获取会话中其他用户的信息
app.get(
  "/conversations/otherUser/:conversationId",
  authenticateToken,
  async (req, res) => {
    try {
      const conversationId = req.params.conversationId;
      const userId = req.user._id;

      //加上合法性检查
      if (!ObjectId.isValid(conversationId)) {
        return res.status(400).json({ message: "无效的conversationId" });
      }

      const conversation = await conversationsCollection.findOne({
        _id: new ObjectId(conversationId),
        participants: { $in: [new ObjectId(userId)] }, // 强制转为 ObjectId 类型
      });

      if (!conversation) {
        return res.status(404).json({ message: "会话不存在" });
      }

      const otherUserId = conversation.participants.find(
        (id) => id.toString() !== userId.toString()
      );

      const otherUser = await usersCollection.findOne({
        _id: new ObjectId(otherUserId),
      });

      if (!otherUser) {
        return res.status(404).json({ message: "用户不存在" });
      }

      res.status(200).json(otherUser);
    } catch (error) {
      console.error("获取其他用户信息失败:", error);
      res.status(500).json({ message: "服务器错误" });
    }
  }
);

//* 获取会话列表
app.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);

    const conversations = await conversationsCollection
      .aggregate([
        // 筛选包含当前用户的会话
        { $match: { participants: userId } },

        // 计算另一个用户的 ID（排除当前用户）
        {
          $addFields: {
            otherParticipantId: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: "$participants",
                    as: "participant",
                    cond: { $ne: ["$$participant", userId] },
                  },
                },
                0,
              ],
            },
          },
        },

        // 联表查询，获取另一个用户的信息
        {
          $lookup: {
            from: "Users",
            let: { otherParticipantId: "$otherParticipantId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$otherParticipantId"] } } },
              { $project: { password: 0 } },
            ],
            as: "otherParticipant",
          },
        },

        // 展开 otherParticipant 数组，确保返回的是对象而非数组
        {
          $unwind: {
            path: "$otherParticipant",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 查询 Messages 表中该会话的最新消息，包括 receiverId
        {
          $lookup: {
            from: "Messages",
            let: { conversationId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$conversationId", "$$conversationId"] },
                },
              },
              { $sort: { createdAt: -1 } }, // 获取最新的消息
              { $limit: 1 },
            ],
            as: "latestMessage",
          },
        },
        // 提取 receiverId 和 isRead 信息
        {
          $addFields: {
            isRead: {
              $cond: {
                if: { $gt: [{ $size: "$latestMessage" }, 0] },
                then: { $arrayElemAt: ["$latestMessage.isRead", 0] },
                else: true,
              },
            },
          },
        },

        // 不需要返回 messagesLookup 字段
        {
          $project: { messagesLookup: 0 },
        },

        // 按最后消息时间降序排序
        { $sort: { lastMessageAt: -1 } },
      ])
      .toArray();

    res.json(conversations);
  } catch (error) {
    console.error("获取会话失败:", error);
    res.status(500).json({ error: "获取会话失败" });
  }
});

//*发送消息
app.post("/messages", authenticateToken, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const currentConversation = await conversationsCollection.findOne({
      _id: new ObjectId(conversationId),
    });
    const senderId = new ObjectId(req.user._id);
    // 找到 participants 数组中 不是 senderId 的那个 ID
    const receiverId = currentConversation.participants.find(
      (id) => !id.equals(senderId)
    );

    const newMessage = {
      conversationId: new ObjectId(conversationId),
      senderId,
      receiverId,
      content,
      createdAt: new Date(),
      isRead: false,
    };

    await messagesCollection.insertOne(newMessage);
    // 更新会话的最后消息时间
    await conversationsCollection.updateOne(
      { _id: new ObjectId(conversationId) },
      { $set: { lastMessageAt: new Date() } }
    );
    res.status(201).json({ message: "消息发送成功", messageData: newMessage });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({ message: "发送消息失败" });
  }
});

// *获取会话消息
app.get("/messages/:conversationId", authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await messagesCollection
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ createdAt: 1 })
      .toArray();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "获取消息失败" });
  }
});

//*标记已读
app.post(
  "/messages/:conversationId/read",
  authenticateToken,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = new ObjectId(req.user._id);
      await messagesCollection.updateMany(
        {
          conversationId: new ObjectId(conversationId),
          receiverId: userId,
          isRead: false,
        },
        { $set: { isRead: true } }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "标记消息已读失败" });
    }
  }
);

// 封装通知函数
async function addNotification({
  receiverId,
  senderId,
  type,
  content,
  postId,
  postUserName,
}) {
  try {
    const notification = {
      receiverId: new ObjectId(receiverId), // 接收通知的用户
      senderId: senderId ? new ObjectId(senderId) : null, // 触发通知的用户
      type, // 通知类型
      content, // 提示文本
      postId: postId ? new ObjectId(postId) : null, //关联帖子ID
      isRead: false, // 是否已读
      createdAt: new Date(),
      postUserName,
    };
    const insertResult = await notificationsCollection.insertOne(notification);

    // 计算未读通知数量
    const unreadCount = await notificationsCollection.countDocuments({
      receiverId: new ObjectId(receiverId),
      isRead: false,
    });
    // 推送实时通知给目标用户（如果在线）
    const targetSocket = onlineUsers[receiverId.toString()];
    if (targetSocket) {
      targetSocket.emit("newNotification", {
        ...notification,
        _id: insertResult.insertedId,
        unreadCount,
      });
    }
  } catch (error) {
    console.error("添加通知失败:", error);
  }
}

// 启动服务器
server.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server is running at http://localhost:${port}`);
});
