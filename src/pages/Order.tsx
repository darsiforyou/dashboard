import {
  Button,
  createStyles,
  Modal,
  TextInput,
  Title,
  SimpleGrid,
  useMantineTheme,
  Checkbox,
  Image,
  Drawer,
  Input,
  Select,
  Box,
  ScrollArea,
  Group,
  ActionIcon,
  Center,
  Container,
  Table,
  Text,
} from "@mantine/core";
import { FormEvent, useRef, useState } from "react";
import { TbPlus } from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import { ORDERS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { getFormData } from "../utils/getFormData";
import { useQuery } from "react-query";
// import { DataTable } from "primereact/datatable";
import { DataTable } from "mantine-datatable";
import { Column } from "primereact/column";
import { Pencil, Trash, Search, Filter } from "tabler-icons-react";
import placeholder from "../assets/placeholder.png";
import { format } from "fecha";
import { Dropdown } from "primereact/dropdown";
import { Item2, Option2, Order } from "../Types/types";
import {
  IconDownload,
  IconEye,
  IconTemperature,
  IconTrash,
} from "@tabler/icons";
import { showNotification } from "@mantine/notifications";
import { ConfirmModal } from "../components/ConfirmModal";
import { useReactToPrint } from "react-to-print";
import darsiIcon from "../assets/darsi-logo.png";
import { jsPDF } from "jspdf";
import { useLocation, useSearchParams } from "react-router-dom";

type Props = {};

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "16px",
  },
}));

const fetchTableData = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${ORDERS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Orders({}: Props) {
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const location = useLocation();
  let [searchParams, setSearchParams] = useSearchParams();
  let params: Record<string, string | null> = {};

  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  // const {orderStatus} = location.
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: params?.page ?? 1,
    email: "",
    phone: "",
    city: "",
    orderStatus: params?.orderStatus ?? "",
    postalCode: "",
    applied_Referral_Code: user.role === "Referrer" ? user.user_code : "",
    vendorId: user.role === "Vendor" ? user._id : "",
    productCode: "",
    category: "",
  });

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });
  // const handleDownload = async () => {
  //   const doc = new jsPDF();
  //   doc.html(componentRef.current, {
  //     callback: function (doc) {
  //       // Save the PDF
  //       doc.save("sample-document.pdf");
  //     },
  //   });
  // };
  const [total, setTotal] = useState(0);
  // const calculateProductsTotal = (arr: Item2[]) => {
  //   arr?.reduce((acc: number, cur) => {
  //     return setTotal((acc += cur.price * cur.qty));
  //   }, 0);
  // };
  const handleDownload = useReactToPrint({
    onBeforePrint: () => setDownloading(true),
    content: () => componentRef.current,
    removeAfterPrint: true,
    print: async (printIframe) => {
      const printarea = printIframe.contentDocument;
      if (printarea) {
        const html = printarea.getElementsByTagName("html")[0];
        const doc = new jsPDF();
        doc.html(html, {
          callback: function (doc) {
            // Save the PDF
            doc.save("sample-document.pdf");
            setDownloading(false);
          },
          x: 15,
          y: 15,
          width: 180, //target width in the PDF document
          windowWidth: 650, //window width in CSS pixels
        });
      }
    },
  });
  const filterFormInit: typeof filters = {
    search: "",
    limit: 10,
    page: 1,
    email: "",
    phone: "",
    city: "",
    orderStatus: "",
    postalCode: "",
    applied_Referral_Code: user.role === "Referrer" ? user.user_code : "",
    vendorId: user.role === "Vendor" ? user._id : "",
    productCode: "",
    category: "",
  };
  const {
    isLoading,
    error,
    data: orders,
    refetch,
  } = useQuery(["orders", filters], fetchTableData, {
    enabled: true,
    //keepPreviousData: true,
    refetchOnWindowFocus: true,
  });

  const { classes } = useStyles();

  const theme = useMantineTheme();

  const filterForm = useForm({
    initialValues: filters,
  });
  async function handleOrderStatusChange(orderStatus: string, id: string) {
    let res = await axiosConfig.put(ORDERS + "/status-change/" + id, {
      orderStatus,
    });
    if (res?.status === 200) {
      refetch();
      showNotification({
        message: "Order status changed",
        color: "green",
      });
    }
  }

  async function handleOrderPaymentStatus(paymentStatus: string, id: string) {
    let res = await axiosConfig.put(ORDERS + "/payment-status-change/" + id, {
      paymentStatus,
    });
    if (res?.status === 200) {
      refetch();
      showNotification({
        message: "Order status changed",
        color: "green",
      });
    }
  }

  const onGlobalFilterChange = async (e: any) => {
    const value = e.target.value;
    setfilters((prev: any) => ({ ...prev, search: value }));
    await refetch();
  };

  const viewOrderDetails = (order: Order) => {
    setViewModalOpened(true);
    setSelectedOrder(order);
  };

  const handleFilterForm = async (e: FormEvent) => {
    e.preventDefault();
    const values = filterForm.values;
    setfilters((prev) => ({
      ...prev,
      ...values,
    }));
    refetch();
    setOpenedDrawer(false);
  };
  const onPagination = async (event: any) => {
    await setfilters((prev: any) => ({
      ...prev,
      // limit: event.rows,
      page: event,
    }));
    await refetch();
  };

  return (
    <>
      <div className={classes.header}>
        <Title>Orders</Title>
      </div>
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
      <Box sx={{ maxheight: "80vh" }}>
        <DataTable
          withColumnBorders
          striped
          highlightOnHover
          minHeight={"150px"}
          page={orders?.data?.page}
          onPageChange={onPagination}
          totalRecords={orders?.data?.totalDocs}
          recordsPerPage={filters.limit}
          idAccessor="_id"
          fontSize="sm"
          records={orders?.data?.docs}
          fetching={isLoading}
          columns={[
            {
              accessor: "_id",
              title: "#",
              textAlignment: "right",
              width: 40,
              render: (record: Order) => orders?.data?.docs.indexOf(record) + 1,
            },
            {
              accessor: "actions",
              width: 100,
              render: (record) => (
                <Group spacing={4} position="right" noWrap>
                  <ActionIcon
                    color="green"
                    onClick={() => viewOrderDetails(record)}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  {user.role === "Admin" && (
                    <ActionIcon
                      color="red"
                      onClick={() => {
                        setDeleteModalOpened(true), setSelectedOrder(record);
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Group>
              ),
            },
            {
              accessor: "createdAt",
              ellipsis: true,
              width: 100,
              render: (record) => (
                <span>{format(new Date(record.createdAt), "DD-MMM-YY")}</span>
              ),
            },
            { accessor: "name", width: 150, hidden: user.role !== "Admin" },


            
            {
              accessor: "email",
              width: 150,
              hidden: user.role !== "Admin",
              ellipsis: true,
            },


            {
              accessor: "applied_Referral_Code",
              width: 150,
              hidden: user.role !== "Admin",
              ellipsis: true,
            },


            
            { accessor: "phone", width: 100, hidden: user.role !== "Admin" },
            {
              accessor: "order_number",
              title: "Order No",
            },
            {
              accessor: "totalQty",
              hidden: user.role === "Referrer",
              title: "Qty",
              render: (order: Order, index) => (
                <span>
                  {user.role === "Admin"
                    ? order.cart.items.reduce((acc, cur) => (acc += cur.qty), 0)
                    : order.cart.items.reduce((acc, cur) => {
                        if (cur.vendor === user._id) {
                          return (acc += cur.qty);
                        }
                        return acc;
                      }, 0)}
                </span>
              ),
            },
            {
              accessor: "totalCost",
              hidden: user.role === "Referrer",
              title: "Cost",
              render: (order: any, index) => (
                <span>
                  {user.role === "Vendor"
                    ? order.cart.items.reduce((acc: any, cur: any) => {
                        if (cur.vendor === user._id) {
                          return (acc += cur.vendorPrice * cur.qty);
                        }
                        return acc;
                      }, 0)
                    : order.cart.totalCost}
                </span>
              ),
            },
            {
              accessor: "totalCost2",
              hidden: user.role !== "Referrer",
              title: "Cost",
              render: (order: Order, index) => (
                <span>
                  {order.cart.totalCost -
                    order.cart.discount -
                    order.cart.shippingCharges}
                </span>
              ),
            },
            {
              accessor: "discount",
              hidden: user.role === "Vendor",
              render: ({ cart }: Order, index) => <span>{cart.discount}</span>,
            },
            // {
            //   accessor: "profit",
            //   title: "Profit",
            //   hidden: user.role !== "Referrer",
            //   render: ({ cart }: Order, index) => (
            //     <span>
            //       {((cart.totalProfitMargin - cart.discount) *
            //         user?.commission) /
            //         100}
            //       {cart.totalProfitMargin}
            //     </span>
            //   ),
            // },
            {
              accessor: "shipping",
              hidden: user.role !== "Admin",
              render: ({ cart }: Order, index) => (
                <span>{cart.shippingCharges}</span>
              ),
            },
            {
              accessor: "netCost",
              hidden: user.role !== "Admin",
              render: ({ cart }: Order, index) => (
                <span>
                  {cart.items.reduce(
                    (acc, cur) => (acc += cur.price * cur.qty),
                    0
                  ) +
                    cart.shippingCharges -
                    cart.discount}
                </span>
              ),
            },
            // {
            //   accessor: "netCost",
            //   hidden: user.role === "Admin",
            //   render: (order: Order, index) => (
            //     <span>
            //       {order.items.reduce(
            //         (acc, cur) => (acc += cur.price * cur.qty),
            //         0
            //       )}
            //     </span>
            //   ),
            // },
            // {
            //   accessor: "address",
            //   hidden: user.role !== "Admin",
            //   width: 200,
            //   ellipsis: true,
            //   render: (record: Order, index) => <span>{record.address}</span>,
            // },
            {
              accessor: "city",
              hidden: user.role !== "Admin",
              render: (record: Order, index) => <span>{record.city}</span>,
            },



            {
              accessor: "paymentMethod",
              hidden: user.role !== "Admin",
            },
            {
              accessor: "paymentStatus",
              hidden: user.role !== "Admin",
              render: (record: Order, index) => (
                <span>{record.paymentStatus ? "Paid" : "Unpaid"}</span>
              ),
            },
            {
              accessor: "orderStatus",
              width: 200,
              render: ({ orderStatus, _id }: Order, index) => {
                if (user.role === "Admin") {
                  return (
                    <Select
                      style={{ width: "100%" }}
                      value={orderStatus}
                      size="sm"
                      withinPortal={true}
                      maxDropdownHeight={300}
                      data={[
                        { label: "Pending", value: "Pending" },
                        { label: "Order Accepted", value: "Order Accepted" },
                        {
                          label: "Order Processing",
                          value: "Order Processing",
                        },
                        { label: "Delivered", value: "Delivered" },
                        {
                          label: "Out For Delivery",
                          value: "Out For Delivery",
                        },
                        { label: "Cancelled", value: "Cancelled" },
                        { label: "Sale Return", value: "Sale Return" },
                      ]}
                      onChange={(e: string) => handleOrderStatusChange(e, _id)}
                    />
                  );
                } else {
                  return orderStatus;
                }
              },
            },
          ]}
        />
      </Box>

      <Drawer
        opened={openedDrawer}
        onClose={() => setOpenedDrawer(false)}
        padding="xl"
        title="Filter"
        overlayColor={
          theme.colorScheme === "dark"
            ? theme.colors.dark[9]
            : theme.colors.gray[2]
        }
        position="right"
        size="md"
        overlayOpacity={0.55}
        overlayBlur={3}
      >
        {/* Drawer content */}
        <form onSubmit={handleFilterForm}>
          <TextInput
            label="Email"
            placeholder="Email"
            {...filterForm.getInputProps("email")}
          />
          <TextInput
            label="Phone"
            placeholder="Phone"
            {...filterForm.getInputProps("phone")}
          />
          <TextInput
            label="City"
            placeholder="City"
            {...filterForm.getInputProps("city")}
          />
          <TextInput
            label="Postal Code"
            placeholder="Postal Code"
            {...filterForm.getInputProps("postalCode")}
          />
          <Select
            label="Status"
            mt={"xs"}
            data={[
              { label: "Pending", value: "Pending" },
              { label: "Order Accepted", value: "Order Accepted" },
              { label: "Order Processing", value: "Order Processing" },
              { label: "Delivered", value: "Delivered" },
              { label: "Out For Delivery", value: "Out For Delivery" },
              { label: "Cancelled", value: "Cancelled" },
            ]}
            placeholder="Status"
            {...filterForm.getInputProps("orderStatus")}
            clearable
          />
          {user.role !== "Referrer" && (
            <TextInput
              label="Discount Code"
              placeholder="Discount Code"
              {...filterForm.getInputProps("applied_Referral_Code")}
            />
          )}
          <br />
          <Button
            type="button"
            style={{ marginRight: 10 }}
            onClick={() => {
              filterForm.reset();
              setSearchParams({});
              params = {};
              // setfilters((prev) => ({
              //   ...prev,
              //   ...filterFormInit,
              // }));
              setfilters((prev) => filterFormInit);
              refetch();
              setOpenedDrawer(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit">Filter</Button>
        </form>
      </Drawer>
      <Modal
        opened={viewModalOpened}
        onClose={() => setViewModalOpened(false)}
        size={600}
        withCloseButton={false}
      >
        {selectedOrder && (
          <>
            <Box ref={componentRef} sx={{ height: "100%" }}>
              <Center>
                <Image width={100} src={darsiIcon} />
              </Center>
              {user.role === "Admin" ? (
                <>
                  <Table mt={"md"} withColumnBorders withBorder>
                    <tbody>
                      <tr>
                        <td>
                          <b>Order No</b>
                        </td>
                        <td>{selectedOrder.order_number}</td>
                        <td>
                          <b>Date</b>
                        </td>
                        <td>
                          {format(
                            new Date(selectedOrder.createdAt),
                            "DD-MMM-YY"
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <b>Name</b>
                        </td>
                        <td colSpan={3}>{selectedOrder.name}</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Email</b>
                        </td>
                        <td>{selectedOrder.email}</td>
                        <td>
                          <b>Mobile</b>
                        </td>
                        <td>{selectedOrder.phone}</td>
                      </tr>
                      <tr>
                        <td>
                          <b>Address</b>
                        </td>
                        <td colSpan={3}>{selectedOrder.address}</td>
                      </tr>
                      <tr>
                        <td>
                          <b>City</b>{" "}
                        </td>
                        <td>{selectedOrder.city}</td>
                        <td>
                          <b>Postal Code</b>
                        </td>
                        <td>{selectedOrder.postalCode}</td>
                      </tr>
                    </tbody>
                  </Table>
                  <Table mt={"md"} withColumnBorders withBorder>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.items?.map((item: Item2, i) => (
                        <tr key={i}>
                          <td style={{ width: "60%" }}>
                            {item.title}
                            {item.options?.map((option: Option2) => (
                              <Group key={option._id}>
                                <Text>
                                  {option.key} - {option.selected}
                                </Text>
                              </Group>
                            ))}
                          </td>
                          <td>{item.qty}</td>
                          <td>Rs. {item.price}</td>
                          <td>Rs. {item.qty * item.price}</td>
                        </tr>
                      ))}

                      <tr>
                        <td colSpan={3}>
                          <b>Total</b>
                        </td>
                        <td>
                          <b>
                            Rs.
                            {selectedOrder.items.reduce(
                              (acc, cur) => (acc += cur.price * cur.qty),
                              0
                            )}
                            {/* {calculateProductsTotal(selectedOrder.items)} */}
                            {/* {selectedOrder.cart.netCost} */}
                            {/* {selectedOrder.cart.totalCost -
                          selectedOrder.cart.shippingCharges -
                          selectedOrder.cart.discount} */}
                          </b>
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3}>Shipping Charges</td>
                        <td>Rs. {selectedOrder.cart.shippingCharges}</td>
                      </tr>
                      <tr>
                        <td colSpan={3}>Discount</td>
                        <td>Rs. {selectedOrder.cart.discount}</td>
                      </tr>
                      <tr>
                        <td colSpan={3}>
                          <b>Grand Total</b>
                        </td>
                        <td>
                          <b>
                            Rs.{" "}
                            {selectedOrder.cart.totalCost -
                              selectedOrder.cart.discount}
                          </b>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </>
              ) : (
                <>
                  <Table mt={"md"} withColumnBorders withBorder>
                    <tbody>
                      <tr>
                        <td>
                          <b>Order No</b>
                        </td>
                        <td>{selectedOrder.order_number}</td>
                        <td>
                          <b>Date</b>
                        </td>
                        <td>
                          {format(
                            new Date(selectedOrder.createdAt),
                            "DD-MMM-YY"
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                  <Table mt={"md"} withColumnBorders withBorder>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder?.items?.map((item: Item2) => (
                        <tr key={item.productId}>
                          <td style={{ width: "60%" }}>
                            {item.title}
                            {item.options?.map((option: Option2) => (
                              <Group key={option._id}>
                                <Text>
                                  {option.key} - {option.selected}
                                </Text>
                              </Group>
                            ))}
                          </td>
                          <td>{item.qty}</td>
                          <td>Rs. {item.price}</td>
                          <td>Rs. {item.qty * item.price}</td>
                        </tr>
                      ))}

                      <tr>
                        <td colSpan={3}>
                          <b>Total</b>
                        </td>
                        <td>
                          <b>
                            Rs.
                            {selectedOrder.items.reduce(
                              (acc, cur) => (acc += cur.price * cur.qty),
                              0
                            )}
                          </b>
                        </td>
                      </tr>
                      {user.role === "Admin" && (
                        <>
                          <tr>
                            <td colSpan={3}>Shipping Charges</td>
                            <td>Rs. {selectedOrder.cart.shippingCharges}</td>
                          </tr>
                          <tr>
                            <td colSpan={3}>Discount</td>
                            <td>Rs. {selectedOrder.cart.discount}</td>
                          </tr>
                          <tr>
                            <td colSpan={3}>
                              <b>Grand Total</b>
                            </td>
                            <td>
                              <b>
                                Rs.{" "}
                                {user.role === "Admin" &&
                                  selectedOrder.cart.totalCost -
                                    selectedOrder.cart.discount}
                              </b>
                            </td>
                          </tr>
                        </>
                      )}
                      {user.role === "Referrer" && (
                        <>
                          <tr>
                            <td colSpan={3}>Discount</td>
                            <td>Rs. {selectedOrder.cart.discount}</td>
                          </tr>
                          <tr>
                            <td colSpan={3}>
                              <b>Grand Total</b>
                            </td>
                            <td>
                              <b>
                                Rs.{" "}
                                {user.role === "Admin" &&
                                  selectedOrder.cart.totalCost -
                                    selectedOrder.cart.discount}
                              </b>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </Table>
                </>
              )}

              {/* <Box sx={{ marginTop: "auto" }}>Hello Mom</Box> */}
            </Box>
            <Container>
              <Group position="center">
                <Button mt={10} onClick={handlePrint}>
                  Print
                </Button>
                <Button loading={downloading} mt={10} onClick={handleDownload}>
                  Download
                </Button>
              </Group>
            </Container>
          </>
        )}
      </Modal>
      <ConfirmModal
        opened={deleteModalOpened}
        _id={selectedOrder?._id}
        apiPoint={ORDERS}
        refetch={refetch}
        title={`Are you sure you want to delete Order?`}
        onClose={() => {
          setDeleteModalOpened(false), setSelectedOrder(null);
        }}
      />
    </>
  );
}
