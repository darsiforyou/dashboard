// hooks/useLiveUser.ts
import { useEffect, useState } from "react";
import axiosConfig from "../configs/axios";
import { USERS } from "../utils/API_CONSTANT";

export default function useLiveUser(userId: string) {
  const [user, setUser] = useState(() => {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  });

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axiosConfig.get(`${USERS}/${userId}`);
        const updatedUser = res.data;

        setUser(updatedUser);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [userId]);

  return user;
}
