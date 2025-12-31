import {
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Stack,
  Divider,
  Box,
  Select,
  SelectItem,
} from "@mantine/core";
import axiosConfig from "../configs/axios";
import { DASHBOARD, PRODUCTS } from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { useQuery } from "react-query";
import { ReportMoney, ShoppingCart, User } from "tabler-icons-react";
import { Chart } from "primereact/chart";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import TopItems from "../components/TopItems";
import { Calendar } from "primereact/calendar";
import { DateRangePicker, DateRangePickerValue } from "@mantine/dates";
import { ApiResponse, Data, Product } from "../Types/types";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { convertToMoney } from "../utils/convertToMoney";
type Props = {};
const fetchCounts = async ({ queryKey }: any) => {
  const [_, { code }] = queryKey;

  const res: AxiosResponse = await axiosConfig.get(
    `${DASHBOARD}/counts?code=${code}`
  );
  const data = res.data;
  return data;
};
const fetchCountsRef = async ({ queryKey }: any) => {
  const [_, { user }] = queryKey;
  const res: AxiosResponse = await axiosConfig.get(
    `${DASHBOARD}/ref_count/${user.user_code}`
  );
  const data = res.data;
  return data;
};
const fetchCountsVendor = async ({ queryKey }: any) => {
  const [_, { user }] = queryKey;
  const res: AxiosResponse = await axiosConfig.get(
    `${DASHBOARD}/ven_count/${user._id}`
  );
  const data = res.data;
  return data;
};
const fetchProducts = async ({ queryKey }: any): Promise<Product[]> => {
  const [_, { vendor }] = queryKey;
  // const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${PRODUCTS}/without_filter?${vendor ? vendor : ""}`
  );
  const data = res.data;
  return data;
};
const getChartData = async ({ queryKey }: any) => {
  const [_, { role, code, chartDates, productId, vendorId }] = queryKey;
  // if(!chartDates[0] || !chartDates[1]) return
  const startDate = chartDates[0];
  const endDate = chartDates[1];
  const res: AxiosResponse = await axiosConfig.get(
    `${DASHBOARD}/chart-data?startDate=${startDate}&endDate=${endDate}&role=${role}&code=${code}&productId=${productId}&vendorId=${vendorId}`
  );
  const data = res.data;
  return data;
};

export default function Dashboard({}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  localStorage.clear();
  const { data: counts } = useQuery(
    ["counts", { code: user.role === "Referrer" ? user.user_code : "" }],
    fetchCounts,
    // {
    //   enabled: true,
    //   refetchOnWindowFocus: false,
    // }
    {
    refetchInterval: 10000, // every 10 seconds
    refetchOnWindowFocus: true,
  



    }


  );
  
  const { data: refCounts } = useQuery(
    ["refCounts", { user: user }],
    fetchCountsRef,
    // {
    //   enabled: true,
    //   refetchOnWindowFocus: false,

      {
    refetchInterval: 10000, // every 10 seconds
    refetchOnWindowFocus: true,
  



    }
  );
  const { data: venCounts } = useQuery(
    ["venCounts", { user: user }],
    fetchCountsVendor,
    {
       refetchInterval: 10000, // har 10 second me refresh
    refetchOnWindowFocus: true, // tab active hone par bhi refresh
    }
  );

  const {
    data: Products,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery(
    ["products", { vendor: user.role === "Vendor" ? user._id : "" }],
    fetchProducts,
    {
      enabled: true,
      refetchOnWindowFocus: false,
    }
  );

  const [chartDates, setChartDates] = useState<DateRangePickerValue>([
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date(new Date().toISOString().slice(0, 10)),
  ]);
  const [dateValues, setDateValues] = useState<DateRangePickerValue>([
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date(),
  ]);
  const [products, setProducts] = useState<(string | SelectItem)[]>([""]);
  const [product, setProduct] = useState<string | null>(null);
  const [chartParams, setChartParams] = useState({
    role: user.role,
    code: user.user_code,
    chartDates,
    productId: product,
    vendorId: user.role === "Vendor" ? user._id : "",
  });
  useEffect(() => {
    setChartParams(
      (prev) =>
        (prev = {
          role: user.role,
          code: user.user_code,
          chartDates,
          productId: product || "",
          vendorId: user.role === "Vendor" ? user._id : "",
        })
    );
  }, [chartDates, product]);

  const { data: chartData, isLoading: chartLoading } = useQuery(
    ["chartData", chartParams],
    getChartData,
    {
      enabled: true,
      refetchOnWindowFocus: false,
    }
  );

  const [saleChartData, setSaleChartData] = useState({});
  const [avgChartData, setAvgChartData] = useState({});
  useEffect(() => {
    if (!chartLoading) {
      let labels: string[] = [];
      let averageOrderQuantity: any = [];
      let totalOrderValue: any = [];
      chartData.data.chartData.forEach((x: any) => {
        labels.push(x._id);
        labels = labels.sort((a: any, b: any): any => {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return !(new Date(b).getDate() - new Date(a).getDate());
        });
        averageOrderQuantity.push(x.averageOrderQuantity);
        if (user.role === "Vendor")
          totalOrderValue.push(x.totalOrderValueVendor);
        else totalOrderValue.push(x.totalOrderValue);
      });
      let saleDatasets = [
        {
          label: "Sales",
          data: totalOrderValue,
          fill: false,
          tension: 0.4,
          borderColor: "#42A5F5",
        },
      ];

      let avgDatasets = [
        {
          label: "Average QTY",
          data: averageOrderQuantity,
          fill: false,
          tension: 0.4,
          borderColor: "#42A5F5",
        },
      ];
      setSaleChartData({ labels: labels, datasets: saleDatasets });
      setAvgChartData({ labels: labels, datasets: avgDatasets });
    }
  }, [chartData, chartLoading]);

  useEffect(() => {
    if (!loadingProducts) {
      if (!Products) return;
      let fltered = Products.map((product: Product) => ({
        value: product?._id,
        label: product?.title,
      }));
      setProducts(fltered);
    }
  }, [loadingProducts]);
  console.log('first==', counts?.data)
  console.log('sec==', refCounts?.data)
  console.log('3rd==', venCounts?.data)
  console.log('4th== checking')
  return (
    <>
      <Box sx={{ width: "300px", margin: "10px 0" }}>
        <DateRangePicker
          inputFormat="DD-MMM-YYYY"
          label="Sales Date"
          placeholder="Pick dates range"
          maxDate={dayjs(new Date()).toDate()}
          value={dateValues}
          onChange={(value) => {
            if (!value) return;
            const dates = value as [Date | null, Date | null];
            !dates.includes(null)
              ? (setChartDates(value), setDateValues(value))
              : setDateValues(value);
          }}
        />
      </Box>

      {user.role === "Admin" ? (
        <SimpleGrid
          cols={3}
          breakpoints={[
            { minWidth: 300, cols: 1 },
            { minWidth: 900, cols: 3 },
          ]}
        >
          <Paper
            shadow="xs"
            p="sm"
            sx={(theme) => ({
              borderLeft: `4px solid ${theme.colors.blue[5]}`,
            })}
          >
            <Group>
              <ThemeIcon>
                <ShoppingCart size={16} />
              </ThemeIcon>
              <Text weight={700}>Orders</Text>
            </Group>
            <Group my={"sm"} styles={{ width: "100%" }}>
              <Stack align="center" spacing="xs">
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Pending"
                >
                  {convertToMoney(counts?.data?.orders?.ordersPending) || 0}
                </Text>
                <Text
                  component={Link}
                  to="/orders?orderStatus=Pending"
                  size="sm"
                  my={0}
                >
                  Pending
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Delivered"
                >
                  {convertToMoney(counts?.data?.orders?.ordersCompleted || 0)}
                </Text>
                <Text
                  component={Link}
                  to="/orders?orderStatus=Delivered"
                  size="sm"
                  my={0}
                >
                  Completed
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Cancelled"
                >
                  {convertToMoney(counts?.data?.orders?.ordersCancelled || 0)}
                </Text>

                <Text
                  component={Link}
                  to="/orders?orderStatus=Cancelled"
                  size="sm"
                  my={0}
                >
                  Cancelled
                </Text>
              </Stack>
            </Group>
          </Paper>
          <Paper
            shadow="xs"
            p="sm"
            sx={(theme) => ({
              borderLeft: `4px solid ${theme.colors.blue[5]}`,
            })}
          >
            <Group>
              <ThemeIcon>
                <User size={16} />
              </ThemeIcon>
              <Text weight={700}>Users</Text>
            </Group>
            <Group my={"sm"} styles={{ width: "100%" }}>
              <Stack align="center" spacing="xs">
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/Users?role=Customer"
                >
                  {convertToMoney(counts?.data?.users?.userCustomer || 0)}
                </Text>
                <Text
                  size="sm"
                  my={0}
                  component={Link}
                  to="/Users?role=Customer"
                >
                  Customers
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text size="xl" my={0} component={Link} to="/Users?role=Vendor">
                  {convertToMoney(counts?.data?.users?.userVendor || 0)}
                </Text>
                <Text size="sm" my={0} component={Link} to="/Users?role=Vendor">
                  Vendors
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/Users?role=Referrer"
                >
                  {convertToMoney(counts?.data?.users?.userReferrer || 0)}
                </Text>
                <Text
                  size="sm"
                  my={0}
                  component={Link}
                  to="/Users?role=Referrer"
                >
                  Referrer
                </Text>
              </Stack>
            </Group>
          </Paper>
          <Paper
            shadow="xs"
            p="sm"
            sx={(theme) => ({
              borderLeft: `4px solid ${theme.colors.blue[5]}`,
            })}
          >
            <Group>
              <ThemeIcon>
                <ReportMoney size={16} />
              </ThemeIcon>
              <Text weight={700}>Sales</Text>
            </Group>
            <Group my={"sm"} styles={{ width: "100%" }}>
              <Stack align="center" spacing="xs">
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Pending"
                >
                  Rs.{" "}
                  {convertToMoney(
                    counts?.data?.revenues?.totalIncomePending[0]?.total || 0
                  )}
                </Text>
                <Text
                  size="sm"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Pending"
                >
                  Shadow
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Delivered"
                >
                  Rs.{" "}
                  {convertToMoney(
                    counts?.data?.revenues?.totalIncome[0]?.total || 0
                  )}
                </Text>
                <Text
                  size="sm"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Delivered"
                >
                  Completed
                </Text>
              </Stack>
              <Divider sx={{ height: "auto" }} orientation="vertical" />
              <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                  size="xl"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Cancelled"
                >
                  Rs.{" "}
                  {convertToMoney(
                    counts?.data?.revenues?.totalIncomeCancelled[0]?.total || 0
                  )}
                </Text>
                <Text
                  size="sm"
                  my={0}
                  component={Link}
                  to="/orders?orderStatus=Cancelled"
                >
                  Cancelled
                </Text>
              </Stack>
            </Group>
          </Paper>
        </SimpleGrid>
      ) : null}
      {user.role === "Referrer" ? (
        <SimpleGrid
    cols={3}
    breakpoints={[
      { minWidth: 300, cols: 1 },
      { minWidth: 900, cols: 3 },
    ]}
  >
    {/* Orders Section */}
    <Paper
      shadow="xs"
      p="sm"
      sx={(theme) => ({
        borderLeft: `4px solid ${theme.colors.blue[5]}`,
      })}
    >
      <Group>
        <ThemeIcon>
          <ShoppingCart size={16} />
        </ThemeIcon>
        <Text weight={700}>Orders</Text>
      </Group>
      <Group my={"sm"} styles={{ width: "100%" }}>
        <Stack align="center" spacing="xs">
          <Text size="xl" my={0}>
            {convertToMoney(refCounts?.data?.orders?.ordersPending || 0)}
          </Text>
          <Text size="sm" my={0}>
            Pending
          </Text>
        </Stack>
        <Divider sx={{ height: "auto" }} orientation="vertical" />
        <Stack align="center" spacing="xs" my={"sm"}>
          <Text size="xl" my={0}>
            {convertToMoney(refCounts?.data?.orders?.ordersCompleted || 0)}
          </Text>
          <Text size="sm" my={0}>
            Completed
          </Text>
        </Stack>
        <Divider sx={{ height: "auto" }} orientation="vertical" />
        <Stack align="center" spacing="xs" my={"sm"}>
          <Text size="xl" my={0}>
            {convertToMoney(refCounts?.data?.orders?.ordersCancelled || 0)}
          </Text>
          <Text size="sm" my={0}>
            Cancelled
          </Text>
        </Stack>
      </Group>
    </Paper>

    {/* Users Section */}
    <Paper
      shadow="xs"
      p="sm"
      sx={(theme) => ({
        borderLeft: `4px solid ${theme.colors.blue[5]}`,
      })}
    >
      <Group>
        <ThemeIcon>
          <User size={16} />
        </ThemeIcon>
        <Text weight={700}>Users</Text>
      </Group>
      <Group my={"sm"} styles={{ width: "100%" }}>
        <Stack align="center" spacing="xs">
          <Text size="xl" my={0}>
            {convertToMoney(refCounts?.data?.users?.userCustomer || 0)}
          </Text>
          <Text size="sm" my={0}>
            Customers
          </Text>
        </Stack>
        <Divider sx={{ height: "auto" }} orientation="vertical" />
        <Stack align="center" spacing="xs" my={"sm"}>
          <Text size="xl" my={0}>
            {convertToMoney(refCounts?.data?.users?.userReferrer || 0)}
          </Text>
          <Text size="sm" my={0}>
            Referrers
          </Text>
        </Stack>
      </Group>
    </Paper>

    {/* Revenue / Commission Section */}
    <Paper
      shadow="xs"
      p="sm"
      sx={(theme) => ({
        borderLeft: `4px solid ${theme.colors.blue[5]}`,
      })}
    >
      <Group>
        <ThemeIcon>
          <ReportMoney size={16} />
        </ThemeIcon>
        <Text weight={700}>Revenue</Text>
      </Group>
      <Group my={"sm"} styles={{ width: "100%" }}>
        <Stack align="center" spacing="xs">
          <Text size="xl" my={0}>
            Rs. {convertToMoney(venCounts?.data?.revenue?.walletAmount || 0)}
          </Text>
          <Text size="sm" my={0}>
            Commission
          </Text>
        </Stack>
      </Group>
    </Paper>
  </SimpleGrid>
      ) : null}



      {user.role === "Admin" && (
        <>
          <Divider
            sx={{ height: "10px", width: "100%" }}
            orientation="horizontal"
          />
          <SimpleGrid
            cols={4}
            breakpoints={[
              { minWidth: 300, cols: 1 },
              { minWidth: 1200, cols: 4 },
              { minWidth: 900, cols: 2 },
            ]}
          >
            <TopItems title="Products" data={products} url="/top-products" />
            <TopItems title="Customers" data={products} url="/top-customers" />
            <TopItems title="Referrer" data={products} url="/top-referrers" />
            <TopItems title="Vendors" data={products} url="/top-vendors" />
          </SimpleGrid>
        </>
      )}
      {user.role === "Vendor" ? (
        <>
          <SimpleGrid
            cols={3}
            breakpoints={[
              { minWidth: 300, cols: 1 },
              { minWidth: 900, cols: 3 },
            ]}
          >
            <Paper
              shadow="xs"
              p="sm"
              sx={(theme) => ({
                borderLeft: `4px solid ${theme.colors.blue[5]}`,
              })}
            >
              <Group>
                <ThemeIcon>
                  <ShoppingCart size={16} />
                </ThemeIcon>
                <Text weight={700}>Orders</Text>
              </Group>
              <Group my={"sm"} styles={{ width: "100%" }}>
                <Stack align="center" spacing="xs">
                  <Text
                    size="xl"
                    my={0}
                    component={Link}
                    to="/orders?orderStatus=Pending"
                  >
                    {convertToMoney(venCounts?.data?.order?.ordersPending || 0)}
                  </Text>
                  <Text size="sm" my={0}>
                    Pending
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                  <Text
                    component={Link}
                    to="/orders?orderStatus=Delivered"
                    size="xl"
                    my={0}
                  >
                    {convertToMoney(
                      venCounts?.data?.order?.ordersCompleted || 0
                    )}
                  </Text>
                  <Text size="sm" my={0}>
                    Completed
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                  <Text
                    component={Link}
                    to="/orders?orderStatus=Cancelled"
                    size="xl"
                    my={0}
                  >
                    {convertToMoney(
                      venCounts?.data?.order?.ordersCancelled || 0
                    )}
                  </Text>
                  <Text size="sm" my={0}>
                    Cancelled
                  </Text>
                </Stack>
              </Group>
            </Paper>
            <Paper
              shadow="xs"
              p="sm"
              sx={(theme) => ({
                borderLeft: `4px solid ${theme.colors.blue[5]}`,
              })}
            >
              <Group>
                <ThemeIcon>
                  <User size={16} />
                </ThemeIcon>
                <Text weight={700}>Products</Text>
              </Group>
              <Group my={"sm"} styles={{ width: "100%" }}>
                <Stack align="center" spacing="xs">
                  <Text component={Link} to="/products" size="xl" my={0}>
                    {convertToMoney(
                      venCounts?.data?.product?.totalProducts || 0
                    )}
                  </Text>
                  <Text component={Link} to="/products" size="sm" my={0}>
                    Total
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                  <Text
                    component={Link}
                    to="/products?isActive=true"
                    size="xl"
                    my={0}
                  >
                    {convertToMoney(
                      venCounts?.data?.product?.totalProductsActive || 0
                    )}
                  </Text>
                  <Text
                    component={Link}
                    to="/products?isActive=true"
                    size="sm"
                    my={0}
                  >
                    Active
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                  <Text
                    component={Link}
                    to="/products?isFeatured=true"
                    size="xl"
                    my={0}
                  >
                    {convertToMoney(
                      venCounts?.data?.product?.totalProductsFeature || 0
                    )}
                  </Text>
                  <Text
                    component={Link}
                    to="/products?isFeatured=true"
                    size="sm"
                    my={0}
                  >
                    Feature
                  </Text>
                </Stack>
              </Group>
            </Paper>
            <Paper
              shadow="xs"
              p="sm"
              sx={(theme) => ({
                borderLeft: `4px solid ${theme.colors.blue[5]}`,
              })}
            >
              <Group>
                <ThemeIcon>
                  <ReportMoney size={16} />
                </ThemeIcon>
                <Text weight={700}>Revenue</Text>
              </Group>
              <Group my={"sm"} styles={{ width: "100%" }}>
                <Stack align="center" spacing="xs">
                  <Text size="xl" my={0}>
                    Rs.{" "}
                    {convertToMoney(
                      venCounts?.data?.revenue?.walletAmount || 0
                    )}
                  </Text>
                  <Text size="sm" my={0}>
                    Available Balance
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs">
                  <Text
                    component={Link}
                    to="/financials?activeTab=Pending"
                    size="xl"
                    my={0}
                  >
                    Rs.{" "}
                    {convertToMoney(
                      venCounts?.data?.revenue?.pendingAmount || 0
                    )}
                  </Text>
                  <Text size="sm" my={0}>
                    Pending Balance
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                    component={Link}
                    to="/financials?activeTab=Accepted"
                    size="xl"
                    my={0}
                  >
                    Rs.{" "}
                    {convertToMoney(venCounts?.data?.revenue?.withdraw || 0)}
                  </Text>
                  <Text size="sm" my={0}>
                    Withdraw
                  </Text>
                </Stack>
                <Divider sx={{ height: "auto" }} orientation="vertical" />
                <Stack align="center" spacing="xs" my={"sm"}>
                <Text
                    component={Link}
                    to="/financials"
                    size="xl"
                    my={0}
                  >
                    Rs. {convertToMoney(venCounts?.data?.revenue?.total)}
                  </Text>
                  <Text size="sm" my={0}>
                    Total Revenue
                  </Text>
                </Stack>
              </Group>
            </Paper>
          </SimpleGrid>
          <Divider
            sx={{ height: "10px", width: "100%" }}
            orientation="horizontal"
          />
          <TopItems
            title="Products"
            data={products}
            url="/top-products"
            param={user._id}
          />
        </>
      ) : null}
      <>
        <Divider
          sx={{ height: "10px", width: "100%" }}
          orientation="horizontal"
        />
        <Paper>
          {/* <Group sx={{ padding: "10px" }}>
              <Text weight={700}>Select Date</Text>
              <Calendar
                id="range"
                value={dateValues}
                onChange={({ value }) => {
                  if (!value) return;
                  const dates = value as [Date | null, Date | null];
                  !dates.includes(null)
                    ? (setChartDates(value), setDateValues(value))
                    : setDateValues(value);
                }}
                selectionMode="range"
                readOnlyInput
              />
            </Group> */}
          <Group>
            <Select
              placeholder="Pick one"
              value={product}
              onChange={setProduct}
              data={products}
            />
          </Group>
          <SimpleGrid
            cols={2}
            breakpoints={[
              { minWidth: 300, cols: 1 },
              { minWidth: 900, cols: 2 },
            ]}
          >
            <Paper shadow="xs" p="sm">
              <Group>
                <ThemeIcon>
                  <ShoppingCart size={16} />
                </ThemeIcon>
                <Text weight={700}>Sales</Text>
              </Group>
              <Group my={"sm"} styles={{ width: "100%" }}>
                <Chart width="100%" type="line" data={saleChartData} />
              </Group>
            </Paper>
            <Paper shadow="xs" p="sm">
              <Group>
                <ThemeIcon>
                  <ShoppingCart size={16} />
                </ThemeIcon>
                <Text weight={700}>Average QTY Sale</Text>
              </Group>
              <Group my={"sm"} styles={{ width: "100%" }}>
                <Chart width="100%" type="line" data={avgChartData} />
              </Group>
            </Paper>
          </SimpleGrid>
        </Paper>
      </>
    </>
  );
}
