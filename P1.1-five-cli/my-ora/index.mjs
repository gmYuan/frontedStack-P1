import cliSpinners from "cli-spinners";
import cliCursor from "cli-cursor";
import readline from "readline";
import { BufferListStream } from 'bl';
// 组件库
const spinners = cliSpinners.dots2;
// 默认文本
const text = "loading";
// 输出流
const stream = process.stderr;
// 当前帧
let frameIndex = 0;
// 每一帧的内容
const frames = spinners.frames;
// 每一帧的间隔
const interval = spinners.interval;

const mutedStream = new BufferListStream();
mutedStream.pipe(process.stdout);

const rl = readline.createInterface({
  input: process.stdin,
  output: mutedStream,
});

// 渲染
function render() {
  //  渲染loading
  clear();
  const renderText = frames[frameIndex] + " " + text;
  stream.write(renderText);
  frameIndex = ++frameIndex % frames.length;
}

function clear() {
  stream.cursorTo(0);
  stream.clearLine(1);
}

function stop() {
  clearInterval(i);
  i = undefined;
  clear();
  frameIndex = 0;
  cliCursor.show(stream);
  rl.close();
}

// 启动loading
cliCursor.hide(stream);
let i = setInterval(render, interval);

//  5秒后停止loading
setTimeout(stop, 5000);
