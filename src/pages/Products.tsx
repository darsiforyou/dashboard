import {
  Button,
  createStyles,
  TextInput,
  Title,
  useMantineTheme,
  Select,
  Drawer,
  Group,
  Paper,
  Text,
  Menu,
  ActionIcon,
  Modal,
  Alert,
  List,
  Badge,
  Progress,
  Box,
  ScrollArea,
  Table,
  Divider,
  LoadingOverlay,
  Popover,
  Center,
} from "@mantine/core";
import { FormEvent, useEffect, useState } from "react";
import {
  TbPlus,
  TbFileExport,
  TbCalendar,
  TbDownload,
  TbChevronDown,
  TbFilter,
  TbX,
  TbCheck,
  TbCalendarEvent,
  TbCalendarTime,
  TbCalendarStats,
  TbCalendarCode,
} from "react-icons/tb";
import { z } from "zod";
import { useForm, zodResolver } from "@mantine/form";
import axiosConfig from "../configs/axios";
import {
  GET_CATEGORIES_WITHOUT_FILTER,
  GET_BRANDS_WITHOUT_FILTER,
  GET_USERS_WITHOUT_FILTER,
  PRODUCTS,
  GET_SUBJECTS_WITHOUT_FILTER,
  BRANDS,
} from "../utils/API_CONSTANT";
import { AxiosResponse } from "axios";
import { useQuery } from "react-query";
import ProductsList from "../components/ProductsList";
import ProductModal from "../components/ProductModal";
import { useLocation, useSearchParams } from "react-router-dom";
import { DatePicker } from "@mantine/dates";

type Props = {};

const schema = z.object({
  _id: z.string(),
  imageURL: z.string(),
  imageId: z.string(),
  media: z.any(),
  isbn: z.string().min(10, { message: "ISBN be 10 characters long" }),
  targetAge: z.number(),
  subject: z.string(),
  title: z
    .string()
    .min(2, { message: "Name should have at least 2 letters" })
    .trim(),
  category: z.string(),
  brand: z.string(),
  otherBrandName: z.string(),
  tags: z.string(),
  options: z.any(),
  vendor: z.string(),
  vendorPrice: z.number(),
  price: z.number(),
  available: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  stockCountPending: z.number(),
  productCode: z.string(),
  description: z.string().trim(),
});

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "16px",
  },
  exportCard: {
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.blue[0],
    border: `1px solid ${
      theme.colorScheme === "dark" ? theme.colors.dark[4] : theme.colors.blue[2]
    }`,
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: theme.shadows.md,
    },
  },
  dateRangeContainer: {
    display: "flex",
    gap: theme.spacing.sm,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  quickExportButton: {
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "translateY(-1px)",
    },
  },
  dateDisplay: {
    padding: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor:
      theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1],
  },
  statBadge: {
    fontSize: theme.fontSizes.xs,
    fontWeight: 600,
  },
  exportMenuContent: {
    minWidth: 300,
  },
  dateFilterPopover: {
    minWidth: 400,
  },
}));

type Product = z.infer<typeof schema>;

const fetchProducts = async ({ queryKey }: any) => {
  const [_, { search, page, limit, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const res: AxiosResponse = await axiosConfig.get(
    `${PRODUCTS}?search=${search}&page=${page}&limit=${limit}&${params}`
  );
  const data = res.data;
  return data;
};

export function Products({}: Props) {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [openedDrawer, setOpenedDrawer] = useState(false);
  const [filterProducts, setFilterProducts]: any = useState([]);
  
  // Date states for export
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [dateFilterOpened, setDateFilterOpened] = useState(false);

  const location = useLocation();
  let [searchParams, setSearchParams] = useSearchParams();
  let params: Record<string, string | null> = {};

  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  const [options, setOptions] = useState({
    color: { value: "color", lastValue: "", values: [] },
    size: { value: "size", lastValue: "", values: [] },
    material: {
      value: "material",
      lastValue: "",
      values: [],
    },
    style: { value: "style", lastValue: "", values: [] },
  });

  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: params?.page || "",
    productCode: "",
    available: "",
    isActive: params?.isActive || "",
    isFeatured: params?.isFeatured || "",
    category: "",
    brand: "",
    vendor: user.role !== "Admin" ? user._id : "",
  });

  const {
    isLoading,
    error,
    data: products,
    refetch,
  } = useQuery(["products", filters], fetchProducts, {
    enabled: true,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isLoading && products?.data) {
      setFilterProducts(products.data);
    }
  }, [isLoading, products]);

  const { classes, theme } = useStyles();
  const [isAddModalOpened, setIsAddModalOpened] = useState(false);

  const fetchBrands = async () => {
    const userId = user.role === "Vendor" ? user._id : "";
    const res: AxiosResponse = await axiosConfig.get(
      `${BRANDS}?limit=1000&userId=${userId}`
    );
    const data = res.data.data.docs;
    const brands = data.map((brand: any) => ({
      value: brand._id,
      label: brand.title,
    }));
    brands.push({
      value: "other",
      label: "Other",
    });
    setBrands(brands);
  };

  const fetchSubjects = async () => {
    const res: AxiosResponse = await axiosConfig.get(
      GET_SUBJECTS_WITHOUT_FILTER
    );
    const data = res.data;
    const subjects = data.map((subject: any) => ({
      value: subject._id,
      label: subject.title,
    }));
    setSubjects(subjects);
  };

  const fetchCategories = async () => {
    const res: AxiosResponse = await axiosConfig.get(
      GET_CATEGORIES_WITHOUT_FILTER
    );
    const data = res.data;
    const categories = data.map((category: any) => ({
      value: category._id,
      label: category.title,
    }));
    setCategories(categories);
  };

  const fetchUsers = async () => {
    if (user.role !== "Admin") return;
    const res: AxiosResponse = await axiosConfig.get(
      GET_USERS_WITHOUT_FILTER + "?role=Vendor"
    );
    const data = res.data;
    const users = data.map((x: any) => ({
      value: x._id,
      label: x.firstname + " " + x.lastname,
    }));
    setUsers(users);
  };

  useEffect(() => {
    fetchUsers();
    fetchCategories();
    fetchBrands();
    fetchSubjects();
  }, []);

  const form = useForm({
    validate: zodResolver(schema),
    initialValues: {
      _id: "",
      title: "",
      isbn: "",
      subject: undefined,
      media: [],
      options: [],
      imageURL: "",
      imageId: "",
      category: "",
      brand: "",
      otherBrandName: "",
      tags: "",
      vendor: "",
      vendorPrice: null,
      price: null,
      available: false,
      isActive: false,
      isFeatured: false,
      stockCountPending: null,
      description: "",
    },
  });

  const filterFormInit = {
    productCode: "",
    category: "",
    available: "",
    isActive: params?.isActive || "",
    isFeatured: params?.isFeatured || "",
    vendor: user.role === "Vendor" ? user._id : "",
    targetAge: "",
  };

  const filterForm = useForm({
    initialValues: filterFormInit,
  });

  const handleFilterForm = async (e: FormEvent) => {
    e.preventDefault();
    const values = filterForm.values;
    if (user.role === "Vendor") {
      values.vendor = user._id;
    }
    setfilters((prev) => ({
      ...prev,
      ...values,
    }));
    refetch();
    setOpenedDrawer(false);
  };

  const handleOpenModal = (data: any = {}) => {
    setIsAddModalOpened(true);
    if (data._id) {
      let _options: any = {};

      (data.options || []).forEach((option: any) => {
        _options[option.key] = {
          value: option.key,
          lastValue: "",
          values: option.values || [],
        };
      });

      setOptions((prev) => ({
        ...prev,
        ..._options,
      }));

      form.setValues({
        ...data,
        isbn: data.isbn ? parseInt(data.isbn) : "",
      });
    }
  };

  // Format date for API
  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Export functions
  const exportToExcel = async (type: "current" | "all" | "dateRange") => {
    try {
      setExportLoading(true);

      const params: any = {};

      if (type === "current") {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== "page" && key !== "limit") {
            params[key] = value.toString();
          }
        });
      }

      if (type === "dateRange" && startDate && endDate) {
        params.startDate = formatDateForAPI(startDate);
        params.endDate = formatDateForAPI(endDate);
      }

      const response = await axiosConfig({
        url: `${PRODUCTS}/export/excel`,
        method: "GET",
        params: params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `products_export_${type}_${timestamp}.xlsx`;
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Show success notification
      alert(`Products exported successfully! File: ${filename}`);
    } catch (error: any) {
      console.error("Export error:", error);
      alert(`Export failed: ${error.message || "Unknown error"}`);
    } finally {
      setExportLoading(false);
    }
  };

  const exportCurrentView = () => exportToExcel("current");
  const exportAllProducts = () => exportToExcel("all");
  const exportByDateRange = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    exportToExcel("dateRange");
  };

  // Quick date functions
  const setQuickDate = (range: 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thismonth') => {
    const today = new Date();
    const newStartDate = new Date();
    const newEndDate = new Date();

    switch (range) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'last7days':
        newStartDate.setDate(today.getDate() - 7);
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      case 'last30days':
        newStartDate.setDate(today.getDate() - 30);
        setStartDate(newStartDate);
        setEndDate(today);
        break;
      case 'thismonth':
        newStartDate.setDate(1);
        setStartDate(newStartDate);
        setEndDate(today);
        break;
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate(null);
    setEndDate(null);
  };

  // Format date for display
  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "Not selected";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <div className={classes.header}>
        <Title>Products</Title>
        <Group>
          {/* Export Button with Dropdown */}
          <Menu shadow="md" width={300} position="bottom-end">
            <Menu.Target>
              <Button
                leftIcon={<TbFileExport size={18} />}
                rightIcon={<TbChevronDown size={14} />}
                loading={exportLoading}
                variant="light"
                color="blue"
              >
                Export Excel
              </Button>
            </Menu.Target>

            <Menu.Dropdown className={classes.exportMenuContent}>
              <Menu.Label>Export Options</Menu.Label>
              
              <Menu.Item
                icon={<TbDownload size={16} />}
                onClick={exportCurrentView}
                disabled={!filterProducts?.docs?.length}
              >
                <Group position="apart" w="100%">
                  <div>
                    <Text size="sm">Current View</Text>
                    <Text size="xs" color="dimmed">
                      {filterProducts?.docs?.length || 0} products
                    </Text>
                  </div>
                  <Badge size="sm" color="blue" variant="light">
                    Current
                  </Badge>
                </Group>
              </Menu.Item>
              
              <Menu.Item
                icon={<TbDownload size={16} />}
                onClick={exportAllProducts}
              >
                <Group position="apart" w="100%">
                  <div>
                    <Text size="sm">All Products</Text>
                    <Text size="xs" color="dimmed">
                      Complete database export
                    </Text>
                  </div>
                </Group>
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Date Range Export</Menu.Label>
              
              <Popover
                opened={dateFilterOpened}
                onChange={setDateFilterOpened}
                position="bottom"
                withArrow
                shadow="md"
                width={400}
                classNames={{ dropdown: classes.dateFilterPopover }}
              >
                <Popover.Target>
                  <Menu.Item
                    icon={<TbCalendar size={16} />}
                    onClick={() => setDateFilterOpened((o) => !o)}
                  >
                    <Group position="apart" w="100%">
                      <div>
                        <Text size="sm">Custom Date Range</Text>
                        <Text size="xs" color="dimmed">
                          Select specific dates
                        </Text>
                      </div>
                      {startDate && endDate && (
                        <Badge size="xs" color="green" variant="dot">
                          Set
                        </Badge>
                      )}
                    </Group>
                  </Menu.Item>
                </Popover.Target>
                
                <Popover.Dropdown>
                  <Paper p="md" withBorder>
                    <Group position="apart" mb="md">
                      <Text size="md" weight={600}>Select Date Range</Text>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={resetDateFilter}
                      >
                        <TbX size={14} />
                      </ActionIcon>
                    </Group>
                    
                    <Group grow>
                      <DatePicker
                        label="Start Date"
                        value={startDate}
                        onChange={setStartDate}
                        maxDate={endDate || new Date()}
                        clearable
                        size="sm"
                        icon={<TbCalendarEvent size={16} />}
                      />
                      <DatePicker
                        label="End Date"
                        value={endDate}
                        onChange={setEndDate}
                        minDate={startDate || undefined}
                        maxDate={new Date()}
                        clearable
                        size="sm"
                        icon={<TbCalendarEvent size={16} />}
                      />
                    </Group>
                    
                    <Divider my="md" />
                    
                    <Text size="sm" weight={500} mb="xs">Quick Selections:</Text>
                    <Group spacing="xs">
                      <Button
                        compact
                        variant="light"
                        size="xs"
                        onClick={() => setQuickDate('today')}
                        leftIcon={<TbCalendar size={12} />}
                      >
                        Today
                      </Button>
                      <Button
                        compact
                        variant="light"
                        size="xs"
                        onClick={() => setQuickDate('yesterday')}
                      >
                        Yesterday
                      </Button>
                      <Button
                        compact
                        variant="light"
                        size="xs"
                        onClick={() => setQuickDate('last7days')}
                        leftIcon={<TbCalendarTime size={12} />}
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        compact
                        variant="light"
                        size="xs"
                        onClick={() => setQuickDate('last30days')}
                      >
                        Last 30 Days
                      </Button>
                      <Button
                        compact
                        variant="light"
                        size="xs"
                        onClick={() => setQuickDate('thismonth')}
                        leftIcon={<TbCalendarStats size={12} />}
                      >
                        This Month
                      </Button>
                    </Group>
                    
                    <Divider my="md" />
                    
                    {startDate && endDate && (
                      <Alert color="blue" variant="light" mb="md">
                        <Text size="sm">
                          Exporting from <strong>{formatDateDisplay(startDate)}</strong> to{" "}
                          <strong>{formatDateDisplay(endDate)}</strong>
                        </Text>
                      </Alert>
                    )}
                    
                    <Button
                      fullWidth
                      onClick={() => {
                        exportByDateRange();
                        setDateFilterOpened(false);
                      }}
                      disabled={!startDate || !endDate}
                      leftIcon={<TbDownload size={16} />}
                      loading={exportLoading}
                    >
                      Export Selected Range
                    </Button>
                  </Paper>
                </Popover.Dropdown>
              </Popover>

              <Menu.Divider />

              <Menu.Label>Quick Date Exports</Menu.Label>
              
              <Menu.Item
                icon={<TbCalendar size={16} />}
                onClick={() => {
                  setQuickDate('today');
                  setTimeout(exportByDateRange, 100);
                }}
              >
                Today's Products
              </Menu.Item>
              
              <Menu.Item
                icon={<TbCalendarTime size={16} />}
                onClick={() => {
                  setQuickDate('last7days');
                  setTimeout(exportByDateRange, 100);
                }}
              >
                Last 7 Days
              </Menu.Item>
              
              <Menu.Item
                icon={<TbCalendarTime size={16} />}
                onClick={() => {
                  setQuickDate('last30days');
                  setTimeout(exportByDateRange, 100);
                }}
              >
                Last 30 Days
              </Menu.Item>
              
              <Menu.Item
                icon={<TbCalendarStats size={16} />}
                onClick={() => {
                  setQuickDate('thismonth');
                  setTimeout(exportByDateRange, 100);
                }}
              >
                This Month
              </Menu.Item>
              
              <Menu.Item
                icon={<TbCalendarTime size={16} />}
                onClick={() => {
                  setQuickDate('yesterday');
                  setTimeout(exportByDateRange, 100);
                }}
              >
                Yesterday's Products
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Filter Button */}
          {/* <Button
            leftIcon={<TbFilter size={18} />}
            variant="outline"
            onClick={() => setOpenedDrawer(true)}
          >
            Filter
          </Button> */}

          {/* Add Product Button */}
          <Button
            onClick={() => handleOpenModal()}
            leftIcon={<TbPlus size={18} />}
          >
            Add Product
          </Button>
        </Group>
      </div>

      {/* Export Summary Card */}
      {!isLoading && filterProducts?.docs && (
        <Paper withBorder p="md" mb="md" className={classes.exportCard}>
          <Group position="apart">
            <div>
              <Text size="sm" weight={600} mb={4}>
                Export Summary
              </Text>
              <Text size="sm" color="dimmed">
                Showing {filterProducts.docs.length} of {filterProducts.totalDocs}{" "}
                products
              </Text>
            </div>
            
            <Group spacing="xs">
              <Badge
                color="blue"
                variant="filled"
                className={classes.statBadge}
              >
                {filterProducts.totalPages} pages
              </Badge>
              
              {filterProducts.hasNextPage && (
                <Badge
                  color="green"
                  variant="light"
                  className={classes.statBadge}
                >
                  More available
                </Badge>
              )}
              
              <ActionIcon
                variant="subtle"
                color="blue"
                onClick={exportCurrentView}
                title="Export current view"
                size="lg"
              >
                <TbDownload size={20} />
              </ActionIcon>
            </Group>
          </Group>
          
          {/* Selected Date Range Display */}
          {startDate && endDate && (
            <Paper withBorder p="xs" mt="sm" className={classes.dateDisplay}>
              <Group position="apart" spacing="xs">
                <Text size="xs" weight={500}>
                  Selected Date Range:
                </Text>
                <Group spacing="xs">
                  <Badge size="xs" variant="outline">
                    {formatDateDisplay(startDate)}
                  </Badge>
                  <Text size="xs">→</Text>
                  <Badge size="xs" variant="outline">
                    {formatDateDisplay(endDate)}
                  </Badge>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="red"
                    onClick={resetDateFilter}
                  >
                    <TbX size={12} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          )}
        </Paper>
      )}

      <ProductsList
        filterProducts={filterProducts}
        isLoading={isLoading}
        setOpenedDrawer={setOpenedDrawer}
        setfilters={setfilters}
        refetch={refetch}
        filters={filters}
        user={user}
        handleOpenModal={handleOpenModal}
      />

      <ProductModal
        form={form}
        refetch={refetch}
        users={users}
        isAddModalOpened={isAddModalOpened}
        setIsAddModalOpened={setIsAddModalOpened}
        categories={categories}
        brands={brands}
        subjects={subjects}
        user={user}
        options={options}
        setOptions={setOptions}
      />

      {/* Filter Drawer */}
      <Drawer
        opened={openedDrawer}
        onClose={() => setOpenedDrawer(false)}
        padding="xl"
        title="Filter Products"
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
        <form onSubmit={handleFilterForm}>
          <TextInput
            label="Product Code"
            placeholder="Enter product code"
            {...filterForm.getInputProps("productCode")}
            mb="sm"
          />
          
          <Select
            label="Category"
            data={categories || []}
            placeholder="Select category"
            {...filterForm.getInputProps("category")}
            clearable
            mb="sm"
          />
          
          <Select
            label="Brand"
            data={brands || []}
            placeholder="Select brand"
            {...filterForm.getInputProps("brand")}
            clearable
            mb="sm"
          />
          
          {user.role === "Admin" && (
            <Select
              label="Vendor"
              data={users || []}
              placeholder="Select vendor"
              {...filterForm.getInputProps("vendor")}
              clearable
              mb="sm"
            />
          )}
          
          <Select
            label="Is Active"
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Select status"
            {...filterForm.getInputProps("isActive")}
            clearable
            mb="sm"
          />
          
          <Select
            label="Is Featured"
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Select featured status"
            {...filterForm.getInputProps("isFeatured")}
            clearable
            mb="sm"
          />
          
          <Select
            label="Available"
            data={[
              { label: "All", value: "" },
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
            placeholder="Select availability"
            {...filterForm.getInputProps("available")}
            clearable
            mb="sm"
          />
          
          <Select
            label="Age"
            data={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]}
            placeholder="Select target age"
            clearable
            {...filterForm.getInputProps("targetAge")}
            mb="xl"
          />
          
          <Group position="right" spacing="sm">
            <Button
              type="button"
              variant="light"
              color="red"
              onClick={() => {
                filterForm.reset();
                setfilters((prev) => ({
                  ...prev,
                  ...filterFormInit,
                  vendor: user.role === "Vendor" ? user._id : prev.vendor,
                }));
                refetch();
                setOpenedDrawer(false);
              }}
            >
              Clear All
            </Button>
            <Button type="submit" color="blue">
              Apply Filters
            </Button>
          </Group>
        </form>
      </Drawer>
    </>
  );
}