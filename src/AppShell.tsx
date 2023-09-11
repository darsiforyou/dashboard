import React, { useEffect, useState } from "react";
import {
  AppShell,
  Header,
  Text,
  MediaQuery,
  Burger,
  useMantineTheme,
  Title,
  ActionIcon,
  useMantineColorScheme,
  Image,
  Avatar,
  Box,
  Menu,
  CopyButton,
  Tooltip,
  Group,
} from "@mantine/core";
import { NavbarSimple } from "./components/Navbar";
import { Sun, MoonStars, Logout, Settings, CopyOff } from "tabler-icons-react";
import darsiIcon from "./assets/darsi-logo.png";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IconCheck, IconCopy } from "@tabler/icons";
import { useQuery } from "react-query";
import axiosConfig from "./configs/axios";
export default function ApplicationShell() {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const [mdOpened, setMdOpened] = useState(true);
  const { pathname } = useLocation();
  useEffect(() => {
    setOpened(false); // Close the navigation panel
  }, [pathname]);
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === "dark";
  const user = JSON.parse(sessionStorage.getItem("user") || "");
  const navigate = useNavigate();
  const { data: refPackage, isFetching } = useQuery({
    queryKey: ["package"],
    queryFn: async () => {
      const res = await axiosConfig("/packages/" + user.referral_package);
      const data = res.data;
      return data;
    },
    refetchOnWindowFocus: false,
  });
  console.log(user, "user")
  return (
    <AppShell
      styles={{
        main: {
          background:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      fixed
      navbar={mdOpened ? <NavbarSimple opened={opened} /> : undefined}
      header={
        <Header height={70} p="md">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", height: "100%" }}
            >
              <MediaQuery smallerThan="sm" styles={{ display: "none" }}>
                <Burger
                  opened={mdOpened}
                  onClick={() => setMdOpened((o) => !o)}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>
              <MediaQuery largerThan="sm" styles={{ display: "none" }}>
                <Burger
                  opened={opened}
                  onClick={() => {
                    setOpened((o) => !o), setMdOpened(true);
                  }}
                  size="sm"
                  color={theme.colors.gray[6]}
                  mr="xl"
                />
              </MediaQuery>
              <Link to={"/"}>
                <Image src={darsiIcon} alt="Darsi logo" width={60} />
              </Link>
            </div>
            <div
              style={{ display: "flex", alignItems: "center", height: "100%" }}
            >
              {user.role === "Referrer" ? (
                <Box
                  component="span"
                  sx={{
                    marginRight: 20,
                    display: "flex",
                  }}
                >
                  {user.referral_payment_status === false ?
                    <Text
                    title="Once you pay your amount, you will get the code and earn commission."
                    >xxxx-xxxxx</Text>
                    :
                    <Text>{user.user_code}</Text>
                  }
                  <CopyButton value={user.user_code} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip
                        label={copied ? "Copied" : "Copy"}
                        withArrow
                        position="right"
                      >
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          onClick={copy}
                        >
                          {copied ? (
                            <IconCheck size={16} />
                          ) : (
                            <IconCopy size={16} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Box>
              ) : null}
              <ActionIcon
                variant="outline"
                color={dark ? "yellow" : "blue"}
                onClick={() => toggleColorScheme()}
                title="Toggle color scheme"
                mr={"xs"}
              >
                {dark ? <Sun size={18} /> : <MoonStars size={18} />}
              </ActionIcon>
              <Menu>
                <Menu.Target>
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Avatar src={user.imageURL} radius="xl" mr="md" />
                    <span>
                      <Text>{user.firstname + " " + user.lastname}</Text>
                      <Group>
                        <Text size={"xs"}>{user.role}</Text>
                        {user.role === "Referrer" && (
                          <Text size={"xs"}>
                            ,{!isFetching ? refPackage?.title : "Loading"}
                          </Text>
                        )}
                      </Group>
                    </span>
                  </Box>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    to={"profile"}
                    icon={<Settings size={14} />}
                  >
                    Profile
                  </Menu.Item>
                  <Menu.Item
                    icon={<Logout size={14} />}
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.href = "/login";
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </Header>
      }
    >
      <Outlet />
    </AppShell>
  );
}
