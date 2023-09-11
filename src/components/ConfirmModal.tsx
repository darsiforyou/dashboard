import { Box, Button, Modal, ModalProps } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons";
import { useState } from "react";
import {
  RefetchOptions,
  RefetchQueryFilters,
  QueryObserverResult,
} from "react-query";
import axiosConfig from "../configs/axios";

interface Props extends ModalProps {
  apiPoint: string;
  _id: string | undefined;
  refetch?: <TPageData>(
    options?: (RefetchOptions & RefetchQueryFilters<TPageData>) | undefined
  ) => Promise<QueryObserverResult<any, unknown>>;
}

export function ConfirmModal({
  apiPoint,
  refetch,
  opened,
  _id,
  children,
  title,
  ...props
}: Props) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const res = await axiosConfig.delete(apiPoint + "/" + _id, options);
    const data = res.data;

    if (data.message || res.status == 200) {
      setLoading(false);
      // setOpened(false);
      props.onClose();
      showNotification({
        message: data.message ?? "Deleted...",
        color: "green",
        icon: <IconCheck />,
      });
      refetch && (await refetch());
    }
  };
  return (
    <Modal
      opened={opened}
      centered
      title={title ? title : "Are you sure you want to delete this item?"}
      {...props}
    >
      {children}
      <Box m={"md"}>
        <Button
          size="xs"
          color={"red"}
          onClick={() => handleDelete()}
          type="button"
          loading={loading}
        >
          Yes
        </Button>
        <Button
          onClick={props.onClose}
          size="xs"
          ml={"xs"}
          color={"gray"}
          type="button"
        >
          No
        </Button>
      </Box>
    </Modal>
  );
}
