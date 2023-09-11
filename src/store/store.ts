import create, { SetState, GetState } from "zustand";

export type StoreSlice<T extends object, E extends object = T> = (
  set: SetState<E extends T ? E : E & T>,
  get: GetState<E extends T ? E : E & T>
) => T;

interface IBearSlice {
  eatFish: () => void;
}

const createBearSlice: StoreSlice<IBearSlice, IFishSlice> = (set, get) => ({
  eatFish: () =>
    set((prev) => ({ fishes: prev.fishes > 1 ? prev.fishes - 1 : 0 })),
  sayHello: () => {
    // console.log(`hello ${get().fishes} fishes`);
  },
});

interface IFishSlice {
  fishes: number;
}

const createFishSlice: StoreSlice<IFishSlice> = (set, get) => ({
  fishes: 10,
});

const createRootSlice = (set: SetState<any>, get: GetState<any>) => ({
  ...createBearSlice(set, get),
  ...createFishSlice(set, get),
});

const useStore = create(createRootSlice);
