import { runTest } from "./util.ts";

const params: string[][] = [
  // [
  //   "gs",
  //   "cd",
  //   "cs",
  //   "cd",
  //   "cs",
  //   "cd",
  //   "cs",
  //   "cd",
  //   "bs",
  //   "bd",
  //   "bs",
  //   "bd",
  //   "bs",
  //   "bd",
  //   "bs",
  // ],
  // ["gs", "ci_1", "bs", "ci_2", "cs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "gs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "bs", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "cd", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs", "ci_2", "gd", "ci_3", "gi_1"],
  // ["gs", "ci_1", "bs"],
  // ["gd", "ci_1", "bd"],
];

runTest(params);
