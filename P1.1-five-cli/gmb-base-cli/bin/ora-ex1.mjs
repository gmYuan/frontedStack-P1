
import ora, { oraPromise } from "ora";

// 1. 基础使用
// const spinner = ora().start();

// let progress = 0;
// spinner.color = "red";
// spinner.text = `Loading  ${progress}%`;
// spinner.prefixText = "Download something";

// const timer = setInterval(() => {
//   progress += 1;
//   spinner.text = `Loading  ${progress}%`;
//   if (progress >= 100) {
//     spinner.stop();
//     spinner.succeed("Download successed");
//     clearInterval(timer);
//   }
// }, 100);


// 2. 使用oraPromise
(async () => {
  const p1 = new Promise((resolve) => {
    console.log("p1 do something");
    setTimeout(() => {
      resolve();
    }, 3000);
  });

  await oraPromise(p1, {
    successText: "p1 successed",
    failText: "p1 failed",
    prefixText: "download ora",
    text: "loading",
    spinner: {
      interval: 120,
      frames: ["-", "\\", "|", "/", "-"],
    },
  });

})();
