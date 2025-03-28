import Picker from "@emoji-mart/react";
import styles from './Emoji.module.css'
// eslint-disable-next-line react/prop-types
function Emoji({onEmojiSelect}) {
  return (
    <div className={styles.emojiPickerWrapper}>
      <Picker
        locale="zh"
        set="twitter"
        skinTonePosition="none"
        previewPosition="none"
        searchPosition="none"
        onEmojiSelect={onEmojiSelect}
      />
    </div>
  );
}

export default Emoji;
