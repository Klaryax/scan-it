import { describe, it, expect } from "vitest";
import { computeG } from "./engine";

const DEMO = {
  DF1: [3, 5, 1, 2],
  DF2: [4, 2, 2, 1, 2, 3, 2, 3, 1, 4, 2, 5, 5],
  DF3: {
    impact:     [2,4,2,4,2,3,3,4,2,3,4,2,3,2,1,3,5,2,4],
    likelihood: [2,3,2,4,2,2,4,3,2,3,5,2,3,2,3,3,3,3,4],
  },
  DF4: [1,1,2,2,1,1,2,3,3,2,2,2,1,3,3,1,1,2,1,3],
};

const EXPECTED_G = [
  -10, 20, -15, -5, -50, 10, 40, 45, 100, 15, -40, 45, 55, 10, -10, 5, 25, 15,
  -10, 45, 30, 35, 25, 65, 60, 45, 75, -15, 45, 65, 5, 10, 10, 5, -5, 20, 5,
  -15, -25, -10,
];

describe("computeG", () => {
  it("reproduce el motor de Python con los inputs demo", () => {
    expect(computeG(DEMO)).toEqual(EXPECTED_G);
  });

  it("inputs neutros (todo baseline) => G todo 0", () => {
    const neutral = {
      DF1: [3, 3, 3, 3],
      DF2: Array(13).fill(3),
      DF3: { impact: Array(19).fill(3), likelihood: Array(19).fill(3) },
      DF4: Array(20).fill(2),
    };
    expect(computeG(neutral)).toEqual(Array(40).fill(0));
  });
});
