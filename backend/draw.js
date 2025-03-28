const axios = require("axios");
const AK = "KrdtzVJRJqWefTMmBMqldw34";
const SK = "rm52JnrpZbJymRYm88qByNkK9cEuqrbF";

async function main() {
  let task_id;
  var options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/rpc/2.0/wenxin/v1/extreme/textToImage?access_token=" +
      (await getAccessToken()),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: JSON.stringify({
      prompt: "黑马追赶汽车",
      width: 512,
      height: 512,
    }),
  };

  axios(options)
    .then((response) => {
      console.log(response.data);
      task_id = response.data.data.task_id;
      setTimeout(() => {
        // 使用返回的 task_id 调用 getImgUrl
        getImgUrl(task_id);
      }, 10000);
    })
    .catch((error) => {
      throw new Error(error);
    });
}

/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
function getAccessToken() {
  let options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" +
      AK +
      "&client_secret=" +
      SK,
  };
  return new Promise((resolve, reject) => {
    axios(options)
      .then((res) => {
        resolve(res.data.access_token);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function getImgUrl(task_id) {
  var options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/rpc/2.0/wenxin/v1/extreme/getImg?access_token=" +
      (await getUrlToken()),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: JSON.stringify({
      task_id,
    }),
  };

  axios(options)
    .then((response) => {
      console.log(
        "细致地址：",response.data.data.sub_task_result_list
      );
      console.log("粗糙地址：",response.data.data.sub_task_result_list[0].final_image_list[0].img_url);
    })
    .catch((error) => {
      throw new Error(error);
    });
}

/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
function getUrlToken() {
  let options = {
    method: "POST",
    url:
      "https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=" +
      AK +
      "&client_secret=" +
      SK,
  };
  return new Promise((resolve, reject) => {
    axios(options)
      .then((res) => {
        resolve(res.data.access_token);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
main();
