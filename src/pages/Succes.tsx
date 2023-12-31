import {
  createStyles,
  Title,
  Text,
  Button,
  Container,
  Group,
  Anchor,
} from "@mantine/core";
import { Link } from "react-router-dom";

const useStyles = createStyles((theme) => ({
  root: {
    paddingTop: 80,
    paddingBottom: 80,
  },

  label: {
    textAlign: "center",
    fontWeight: 900,
    fontSize: 220,
    lineHeight: 1,
    marginBottom: theme.spacing.xl * 1.5,
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[4]
        : theme.colors.gray[2],

    [theme.fn.smallerThan("sm")]: {
      fontSize: 120,
    },
  },

  title: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    textAlign: "center",
    fontWeight: 900,
    fontSize: 38,

    [theme.fn.smallerThan("sm")]: {
      fontSize: 32,
    },
  },

  description: {
    maxWidth: 500,
    margin: "auto",
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl * 1.5,
  },
}));

export function Success() {
  const { classes } = useStyles();

  return (
    <Container className={classes.root}>
      <div className={classes.label}>Success</div>
      <Title className={classes.title}>
        Thank you for registering at darsi.pk
      </Title>

      <Group position="center" mt="xl">
        <Text size="lg">
          <Anchor component={Link} to="/login" size="md">
            Click here
          </Anchor>{" "}
          to login to your account
        </Text>
      </Group>
    </Container>
  );
}
