function testRedundant(arr1: string[], arr2: string[]): void {
  const smaller = arr1.length < arr2.length ? arr1 : arr2;
  for (let i = 0; i < smaller.length; i++) {
    if (arr1[i] === arr2[i]) {
      continue;
    }
    return;
  }
  if (arr1.length === arr2.length) {
    return;
  }
  const arr1Str = arr1.map((s) => `"${s}"`).join(", ");
  const arr2Str = arr2.map((s) => `"${s}"`).join(", ");
  const smallerStr = arr1.length < arr2.length ? arr1Str : arr2Str;
  const largerStr = arr1.length < arr2.length ? arr2Str : arr1Str;
  throw new Error(`redundant: [${smallerStr}] in [${largerStr}]`);
}

export const params: string[][] = [
  ["gd", "ci_1", "cd", "ci_2"],
  ["gd", "ci_1", "cs", "ci_2"],
  ["gd", "ci_1", "gd", "ci_2"],
  ["gd", "ci_1", "gs", "ci_2"],
  ["gi_1", "cd", "ci_2"],
  ["gi_1", "cs", "bi_2"],
  ["gi_1", "cs", "ci_2", "bs", "bi_3"],
  ["gi_1", "cs", "ci_2", "bs", "ci_3", "bs", "bi_4"],
  ["gi_1", "cs", "ci_2", "cs", "bi_3"],
  ["gi_1", "cs", "ci_2", "cs", "ci_3", "cs", "bi_4"],
  ["gi_1", "gd", "ci_2"],
  ["gi_1", "gi_1"],
  ["gi_1", "gs", "ci_2"],
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
  [
    "gs",
    "cd",
    "cs",
    "cd",
    "cs",
    "cd",
    "cs",
    "cd",
    "bs",
    "bd",
    "bd",
    "bd",
    "bd",
    "bd",
    "bd",
  ],
  ["gs", "ci_1", "bs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "bs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "bs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "bs", "ci_2", "gd", "ci_3", "gi_1"],
  ["gs", "ci_1", "bs", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cd", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "cd", "ci_3", "gi_1"],
  [
    "gs",
    "ci_1",
    "cs",
    "ci_2",
    "cs",
    "ci_3",
    "cs",
    "ci_4",
    "bs",
    "bi_5",
    "bi_5",
    "bi_6",
    "bi_6",
  ],
  ["gs", "ci_1", "cs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gd", "ci_3", "gi_1"],
  ["gs", "ci_1", "cs", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "bd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gd", "ci_2", "gs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "bs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "cd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "cs", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gd", "ci_3", "gi_1"],
  ["gs", "ci_1", "gs", "ci_2", "gs", "ci_3", "gi_1"],
];

for (const arr1 of params) {
  for (const arr2 of params) {
    testRedundant(arr1, arr2);
  }
}
