import { runTest } from "./util.ts";

const params: string[][] = [
  ["gd"],
  ["gs"],
  ["gi_1"],

  ["gd", "ci_1"],
  ["gs", "ci_1"],
  ["gs", "ci_1", "cs", "ci_2", "cs", "ci_3", "cs", "ci_4", "bs"],
  [
    "gs",
    "cd",
    "ci_1",
    "cd",
    "ci_2",
    "cd",
    "ci_3",
    "cd",
    "ci_4",
    "bd",
    "bd",
    "bd",
  ],
  ["gi_1", "cs", "ci_2", "bs"],
  ["gi_1", "cs", "ci_2", "cs"],
  ["gi_1", "cs", "ci_2", "bs", "ci_3", "bs"],
  ["gi_1", "cs", "ci_2", "cs", "ci_3", "cs"],

  ["gs", "ci_1", "cs", "ci_2"],
  ["gs", "ci_1", "gs", "ci_2"],
  ["gs", "ci_1", "cd", "ci_2"],
  ["gs", "ci_1", "gd", "ci_2"],

  ["gd", "ci_1", "cs", "ci_2"],
  ["gd", "ci_1", "gs", "ci_2"],
  ["gd", "ci_1", "cd", "ci_2"],
  ["gd", "ci_1", "gd", "ci_2"],

  ["gi_1", "cs", "ci_2"],
  ["gi_1", "gs", "ci_2"],
  ["gi_1", "cd", "ci_2"],
  ["gi_1", "gd", "ci_2"],

  ["gs", "ci_1", "gi_1"],
  ["gi_1", "gi_1"],

  ["gs", "ci_1", "cs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "gs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "cd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gd", "ci_3", "gi_1"],

  ["gs", "ci_1", "gd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gd", "ci_3", "gi_1"],
];

runTest(params);
