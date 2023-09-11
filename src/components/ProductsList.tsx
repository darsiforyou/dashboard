import {
  Button,
  Text,
  Card,
  Group,
  Image,
  Input,
  Modal,
  RingProgress,
  Title,
  Box,
  ScrollArea,
  ActionIcon,
  TextInput,
  Switch,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { Column } from "primereact/column";
import { DataTable } from "mantine-datatable";
import React, { useState } from "react";
import { useMutation } from "react-query";
import { Edit, Filter, Pencil, Search, Trash } from "tabler-icons-react";
import axiosConfig from "../configs/axios";
import { Product } from "../Types/types";
import { PRODUCTS } from "../utils/API_CONSTANT";
import { ConfirmModal } from "./ConfirmModal";
import { format } from "fecha";

function ProductsList({
  filterProducts,
  isLoading,
  setOpenedDrawer,
  setfilters,
  refetch,
  filters,
  user,
  handleOpenModal,
}: any) {
  const onGlobalFilterChange = async (e: any) => {
    const value = e.target.value;
    setfilters((prev: any) => ({ ...prev, search: value }));
    await refetch();
  };
  const renderHeader = () => {
    return (
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Input
            icon={<Search />}
            placeholder="Search"
            value={filters.search}
            onChange={onGlobalFilterChange}
            style={{ width: "fit-content" }}
          />
        </div>
        <div>
          <Button
            onClick={() => setOpenedDrawer(true)}
            leftIcon={<Filter size={18} />}
          >
            Filters
          </Button>
        </div>
      </div>
    );
  };
  const onPagination = async (event: any) => {
    await setfilters((prev: any) => ({
      ...prev,
      // limit: event.rows,
      page: event,
    }));
    await refetch();
  };
  const [opened, setOpened] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const actionBodyTemplate = (rowData: any) => {
    return (
      <>
        <Button
          ml={"xs"}
          size="xs"
          type="button"
          onClick={() => handleOpenModal(rowData)}
        >
          <Pencil size={16} />
        </Button>
        <Button
          size="xs"
          ml={"xs"}
          type="button"
          onClick={() => {
            setOpened(true), setDeleteProduct(rowData);
          }}
        >
          <Trash size={16} />
        </Button>
      </>
    );
  };

  // useMutation()

  const handleDelete = async () => {
    const options = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    const res = await axiosConfig.delete(
      PRODUCTS + "/" + deleteProduct?._id,
      options
    );
    const data = res.data;

    if (data.message) {
      setOpened(false);
      showNotification({ message: data.message });
      await refetch();
    }
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}
      >
        <div>
          <TextInput
            icon={<Search size={16} />}
            placeholder="Search"
            value={filters.search}
            onChange={onGlobalFilterChange}
            style={{ width: "fit-content" }}
            size={"sm"}
          />
        </div>
        <div>
          <Button
            onClick={() => setOpenedDrawer(true)}
            leftIcon={<Filter size={16} />}
            size={"sm"}
          >
            Filters
          </Button>
        </div>
      </div>
      <Box sx={{ height: "70vh" }}>
        <DataTable
          withBorder
          withColumnBorders
          striped
          highlightOnHover
          minHeight={"150px"}
          page={filterProducts.page}
          onPageChange={onPagination}
          totalRecords={filterProducts.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          fetching={isLoading}
          records={filterProducts.docs}
          columns={[
            {
              accessor: "index",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: Product) =>
                filterProducts.docs.indexOf(record) + 1,
            },
            {
              accessor: "actions",
              render: (record: Product) => (
                <>
                  <Group spacing={4} noWrap>
                    <ActionIcon
                      color="blue"
                      component="button"
                      variant="light"
                      onClick={(e) => {
                        //  e.stopPropagation();
                        handleOpenModal(record);
                      }}
                    >
                      <Edit size={18} />
                    </ActionIcon>
                    {user.role === "Admin" && (
                      <ActionIcon
                        color="red"
                        variant="light"
                        component="button"
                        onClick={(e) => {
                          // e.stopPropagation();
                          setOpened(true), setDeleteProduct(record);
                        }}
                      >
                        <Trash size={18} />
                      </ActionIcon>
                    )}
                    {/* {user.role === "Vendor" && (
                      <Switch
                        onLabel="Active"
                        offLabel="Disabled"
                        checked={record.isActive}
                        onChange={(event) =>
                          
                        }
                      />
                    )} */}
                  </Group>
                </>
              ),
            },
            {
              accessor: "title",
              width: 150,
              // ellipsis: true,
            },
            {
              accessor: "createdAt",
              title: "Upload At",
              render: ({ createdAt }: any) => (
                <>{format(new Date(createdAt), "DD-MMM-YY")}</>
              ),
            },
            {
              accessor: "imageURL",
              title: "Image",
              width: 100,
              cellsStyle: {
                height: 100,
                margin: "auto 0",
              },
              render: ({ imageURL, media, title }: Product) => (
                <Image
                  width="100%"
                  src={
                    imageURL
                      ? imageURL
                      : media?.find((x: any) => x.isFront)?.imageURL
                  }
                  alt={title}
                  withPlaceholder
                />
              ),
            },
            {
              accessor: "productCode",
            },
            {
              accessor: "isbn",
            },
            {
              accessor: "targetAge",
            },
            {
              accessor: "category",
              render: ({ category_name }: Product, index) => (
                <>{category_name ? category_name : "Not Assign"}</>
              ),
            },
            {
              accessor: "brands",
              width: 150,
              ellipsis: true,
              render: ({ brand_name }: Product) => (
                <>{brand_name ? brand_name : "Not Assign"}</>
              ),
            },
            {
              accessor: "vendor",
              width: 150,
              ellipsis: true,
              hidden: user.role !== "Admin",
              render: ({ vendor_name }: Product) => (
                <>{vendor_name ? vendor_name : "Not Assign"}</>
              ),
            },
            {
              accessor: "vendorPrice",
            },
            {
              accessor: "price",
              title: "Sell Price",
            },
            {
              accessor: "profitMargin",
            },
            {
              accessor: "stockCountPending",
            },
            {
              accessor: "stockCountConsumed",
            },
            {
              accessor: "totalSale",
            },
            {
              accessor: "isActive",
              render: ({ isActive }: Product) => <>{isActive ? "Yes" : "No"}</>,
            },
            {
              accessor: "available",
              render: ({ available }: Product) => (
                <>{available ? "Yes" : "No"}</>
              ),
            },
            {
              accessor: "isFeatured",
              render: ({ isFeatured }: Product) => (
                <>{isFeatured ? "Yes" : "No"}</>
              ),
            },
          ]}
        />
      </Box>
      {/* 
      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false), setDeleteProduct(null);
        }}
        withCloseButton={false}
        title="    Are you sure you want to delete this Product?"
      >
        <Title mt={0} p={0} mb={"xl"} order={4}></Title>
        <Card withBorder p="lg">
          <Card.Section>
            <Image
              src={
                deleteProduct?.imageURL
                  ? deleteProduct.imageURL
                  : deleteProduct?.media?.find((x: any) => x.isFront)?.imageURL
              }
              alt={deleteProduct?.title}
              height={200}
              style={{ objectFit: "contain" }}
            />
          </Card.Section>

          <Group position="apart" mt="xl">
            <Text size="sm" weight={700}>
              {deleteProduct?.title}
            </Text>
            <Group spacing={5}>
              <Text size="xs" weight={700}>
                {deleteProduct?.price}
              </Text>
              <RingProgress
                size={18}
                sections={[{ value: 80, color: "blue" }]}
              />
            </Group>
          </Group>
        </Card>

        <Box m={"md"}>
          <Button
            size="xs"
            color={"red"}
            onClick={() => handleDelete()}
            type="button"
          >
            Yes
          </Button>
          <Button
            onClick={() => {
              setOpened(false), setDeleteProduct(null);
            }}
            size="xs"
            ml={"xs"}
            color={"gray"}
            type="button"
          >
            No
          </Button>
        </Box>
      </Modal> */}

      <ConfirmModal
        opened={opened}
        _id={deleteProduct?._id}
        apiPoint={PRODUCTS}
        refetch={refetch}
        title={"Are you sure you want to delete this Product?"}
        onClose={() => {
          setOpened(false), setDeleteProduct(null);
        }}
      >
        <Title mt={0} p={0} mb={"xl"} order={4}></Title>
        <Card withBorder p="lg">
          <Card.Section>
            <Image
              src={
                deleteProduct?.imageURL
                  ? deleteProduct.imageURL
                  : deleteProduct?.media?.find((x: any) => x.isFront)?.imageURL
              }
              alt={deleteProduct?.title}
              height={200}
              style={{ objectFit: "contain" }}
            />
          </Card.Section>

          <Group position="apart" mt="xl">
            <Text size="sm" weight={700}>
              {deleteProduct?.title}
            </Text>
            <Group spacing={5}>
              <Text size="xs" weight={700}>
                {deleteProduct?.price}
              </Text>
            </Group>
          </Group>
        </Card>
      </ConfirmModal>
    </>
  );
}

export default ProductsList;
