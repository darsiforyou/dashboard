import React, { useEffect, useState } from "react";
import { createStyles, Navbar } from "@mantine/core";
import {
  Settings,
  SwitchHorizontal,
  Logout,
  LayoutDashboard,
  Category2,
  Book2,
  Users,
  Package,
  ShoppingCart,
  TruckDelivery,
} from "tabler-icons-react";
import { Link, useLocation } from "react-router-dom";
import { IconBuildingBank } from "@tabler/icons";

const useStyles = createStyles((theme, _params, getRef) => {
  const icon: any = getRef("icon");
  return {
    header: {
      paddingBottom: theme.spacing.md,
      marginBottom: theme.spacing.md * 1.5,
      borderBottom: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[2]
      }`,
    },

    footer: {
      paddingTop: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderTop: `1px solid ${
        theme.colorScheme === "dark"
          ? theme.colors.dark[4]
          : theme.colors.gray[2]
      }`,
    },

    link: {
      ...theme.fn.focusStyles(),
      display: "flex",
      alignItems: "center",
      textDecoration: "none",
      fontSize: theme.fontSizes.xs,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[1]
          : theme.colors.gray[7],
      padding: `${theme.spacing.xs}px ${theme.spacing.xs}px`,
      borderRadius: theme.radius.xs,
      fontWeight: 500,

      "&:hover": {
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.dark[6]
            : theme.colors.gray[0],
        color: theme.colorScheme === "dark" ? theme.white : theme.black,

        [`& .${icon}`]: {
          color: theme.colorScheme === "dark" ? theme.white : theme.black,
        },
      },
    },

    linkIcon: {
      ref: icon,
      color:
        theme.colorScheme === "dark"
          ? theme.colors.dark[2]
          : theme.colors.gray[6],
      marginRight: theme.spacing.xs,
    },

    linkActive: {
      "&, &:hover": {
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.fn.rgba(theme.colors[theme.primaryColor][8], 0.25)
            : theme.colors[theme.primaryColor][0],
        color:
          theme.colorScheme === "dark"
            ? theme.white
            : theme.colors[theme.primaryColor][7],
        [`& .${icon}`]: {
          color:
            theme.colors[theme.primaryColor][
              theme.colorScheme === "dark" ? 5 : 7
            ],
        },
      },
    },
  };
});

const data = [
  {
    link: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    permision: ["Admin", "Vendor", "Referrer"],
  },
  {
    link: "/categories",
    label: "Categories",
    icon: Category2,
    permision: ["Admin"],
  },
  {
    link: "/mlm",
    label: "MLM",
    icon: Category2,
    permision: ["Admin"],
  },
  {
    link: "/brands",
    label: "Brands",
    icon: Category2,
    permision: ["Admin", "Vendor"],
  },
  {
    link: "/shipping",
    label: "Shipping",
    icon: TruckDelivery,
    permision: ["Admin"],
  },
  {
    link: "/wallet",
    label: "Wallet",
    icon: TruckDelivery,
    permision: ["Admin"],
  },
  {
    link: "/subjects",
    label: "Subjects",
    icon: Category2,
    permision: ["Admin"],
  },
  {
    link: "/products",
    label: "Products",
    icon: Book2,
    permision: ["Admin", "Vendor"],
  },
  {
    link: "/users",
    label: "Users",
    icon: Users,
    permision: ["Admin"],
  },
  {
    link: "/accounts",
    label: "Accounts",
    icon: IconBuildingBank,
    permision: ["Admin", "Referrer", "Vendor"],
  },

  { link: "/packages", label: "Packages", icon: Package, permision: ["Admin"] },
  {
    link: "/orders",
    label: "Orders",
    icon: ShoppingCart,
    permision: ["Admin", "Referrer", "Vendor"],
  },
  {
    link: "/order-list",
    label: "Order list",
    icon: ShoppingCart,
    permision: ["Admin"],
  },
  {
    link: "/financials",
    label: "Financials",
    icon: ShoppingCart,
    permision: ["Admin", "Referrer", "Vendor"],
  },
    {
    link: "/Bank-detail",
    label: "Bank Detail",
    icon: Settings,
    permision: ["Admin"],
  },
  {
    link: "/dashboard-settings",
    label: "Dashboard settings",
    icon: Settings,
    permision: ["Admin"],
  },
  {
    link: "/dashboard-password",
    label: "Dashboard Password",
    icon: Settings,
    permision: ["Admin"],
  },

];

interface Props {
  opened: boolean;
}

export function NavbarSimple({ opened }: Props) {
  const { classes, cx } = useStyles();
  const [active, setActive] = useState("Dashboard");
  const [navLinks, setNavLinks] = useState(data);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    let routes = navLinks.filter((x) => x.permision?.includes(user?.role));
    setNavLinks(routes);
  }, []);
  const location = useLocation();
  useEffect(() => {
    setActive(location.pathname);

    return () => {};
  }, [location]);
  const links = navLinks.map((item) => (
    <Link
      className={cx(classes.link, {
        [classes.linkActive]: item.label === active,
      })}
      to={item.link}
      key={item.label}
      onClick={() => {
        setActive(item.label);
      }}
    >
      <item.icon className={classes.linkIcon} />
      <span>{item.label}</span>
    </Link>
  ));

  return (
    <Navbar
      hidden={!opened}
      width={{ sm: 200, md: 200, lg: 200, xl: 200 }}
      style={{overflowY:"scroll"}}
      p="sm"
    >
      <Navbar.Section grow>{links}</Navbar.Section>
    </Navbar>
  );
}
