export type InfiniteEvent =
  | {
      readonly type: "newChildren";
      readonly children: Element[];
    }
  | {
      readonly type: "unsubscribe";
    };
