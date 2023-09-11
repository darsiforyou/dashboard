import { useLocalStorage } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

type ProtectedRouteProps = {
  outlet: JSX.Element;
};

type User = {
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  role: string;
};

export default function ProtectedRoute({ outlet }: ProtectedRouteProps) {
  // const [user, setUser] = useState<User>();
  // useEffect(() => {
  //   if (user) {
  //     setUser(user);
  //   }
  // }, []);
  // const [user] = useLocalStorage<User>({ key: "user" });
  const user = sessionStorage.getItem("user");
  const parsed = user ? JSON.parse(user) : "";
  if (!parsed) return <Navigate to={{ pathname: "/login" }} />;
  const isCustomer = parsed.role === "Customer";
  if (!isCustomer) {
    return outlet;
  } else {
    return <Navigate to={{ pathname: "/login" }} />;
  }
}
