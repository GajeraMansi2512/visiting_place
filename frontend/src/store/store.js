import { configureStore } from "@reduxjs/toolkit";
import followReducer from "./slice";

export const store = configureStore({
  reducer: {
    follow: followReducer,
  },
});
