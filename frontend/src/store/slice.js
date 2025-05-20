import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getUser } from "./data";

export const getUsers = createAsyncThunk("getUsers", async (id) => {
  return await getUser(id);
});

export const FollowSlice = createSlice({
  name: "follow",
  initialState: {
    data: {
      user: null,
      post: [],
      loginUser: null,
      mutualconnection: [],
    },
  },
  reducers: {
    clearUser: (state) => {
      state.data = { user: null, post: [], loginUser: null };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getUsers.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const { clearUser } = FollowSlice.actions;
export default FollowSlice.reducer;
