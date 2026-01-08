// Profile.tsx - 完整修复版
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { showNotification } from "@mantine/notifications";
import axiosConfig from "../configs/axios";
import { getFormData } from "../utils/getFormData";
import { 
  Alert, 
  Avatar, 
  Button, 
  Card, 
  Divider, 
  FileButton, 
  Group, 
  NumberInput, 
  Paper, 
  SimpleGrid, 
  TextInput, 
  Title, 
  Text,
  Badge,
  Box,
  Loader,
  Center,
  Modal,
  Timeline,
  Image,
  Select,
  Stack,
 
} from "@mantine/core";
import { useForm } from "@mantine/form";
// 如果使用旧版本 @tabler/icons
import { 
  Upload as IconUpload,
  Photo as IconPhoto,
  X as IconX,
  Check as IconCheck,
  Clock as IconClock,
  User as IconUser,
  Package as IconPackage,
  History as IconHistory,
  CurrencyRupee as IconCurrencyRupee,
  Edit as IconEdit,
  Trash as IconTrash,
  AlertCircle as IconAlertCircle
} from "tabler-icons-react";

export function Profile() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.imageURL || null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [packages, setPackages] = useState<{ label: string; value: string; price: number; title: string }[]>([]);
  const [historyModalOpened, setHistoryModalOpened] = useState(false);
  
  const queryClient = useQueryClient();

  // 获取用户当前的升级请求
  const { 
    data: userRequests, 
    isLoading: requestsLoading, 
    refetch: refetchRequests 
  } = useQuery({
    queryKey: ["user-upgrade-requests", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await axiosConfig.get(`/package-upgrades/user/${user._id}`);
      return res.data;
    },
    enabled: !!user?._id,
  });

  // 获取升级历史
  const { 
    data: upgradeHistory, 
    isLoading: historyLoading,
    refetch: fetchHistory 
  } = useQuery({
    queryKey: ["upgrade-history", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await axiosConfig.get(`/package-upgrades/history/${user._id}`);
      return res.data;
    },
    enabled: false, // 手动触发
  });

  // 获取所有套餐
  const { isLoading: packagesLoading } = useQuery({
    queryKey: "referral-packages",
    queryFn: async () => {
      const res = await axiosConfig.get("/packages?page=1&limit=100");
      return res.data?.data?.docs || res.data?.data || [];
    },
    onSuccess: (data) => {
      const sorted = data.sort((a: any, b: any) => a.price - b.price);
      const formatted = sorted.map((pkg: any) => ({
        label: `${pkg.title} - PKR ${pkg.price.toLocaleString()}`,
        value: pkg._id,
        price: pkg.price,
        title: pkg.title
      }));
      setPackages(formatted);
    },
    onError: (error) => {
      showNotification({
        title: "Error",
        message: "Failed to load packages",
        color: "red",
      });
    }
  });

  // 查找当前套餐
  const currentPackage = packages.find(p => p.value === user?.referral_package);
  // 查找待处理请求
  const pendingRequest = userRequests?.data?.find((req: any) => req.status === "pending");

  const form = useForm({
    initialValues: {
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      transaction_id: "",
      requested_package: "",
      amount: 0,
    },
    validate: {
      firstname: (value) => value.trim().length === 0 ? "First name is required" : null,
      lastname: (value) => value.trim().length === 0 ? "Last name is required" : null,
      transaction_id: (value) => value.trim().length === 0 ? "Transaction ID is required" : null,
      requested_package: (value) => value.trim().length === 0 ? "Please select a new package" : null,
      amount: (value) => value <= 0 ? "Amount must be greater than 0" : null,
    },
  });

  // 更新用户信息 mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = getFormData({
        _id: user._id,
        firstname: values.firstname,
        lastname: values.lastname,
        ...(profileFile && { file: profileFile })
      });

      const res = await axiosConfig.put(`/users/${user._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: "Profile updated successfully!",
        color: "green",
      });
      
      // 更新 session storage
      const updatedUser = { 
        ...user, 
        firstname: data.data?.firstname || form.values.firstname, 
        lastname: data.data?.lastname || form.values.lastname,
        imageURL: data.data?.imageURL || user.imageURL
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to update profile",
        color: "red",
      });
    }
  });

  // 提交升级请求 mutation
  const upgradeMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!paymentFile) {
        throw new Error("Payment screenshot is required");
      }

      const upgradeFormData = getFormData({
        user: user._id,
        current_package: user.referral_package,
        requested_package: values.requested_package,
        transaction_id: values.transaction_id,
        amount: values.amount,
        paymentScreenshot: paymentFile,
      });

      const res = await axiosConfig.post("/package-upgrades", upgradeFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: "Upgrade request submitted successfully!",
        color: "green",
      });
      
      // 重置表单
      form.reset();
      setPaymentFile(null);
      setPaymentPreview(null);
      
      // 刷新请求列表
      refetchRequests();
      queryClient.invalidateQueries(["user-upgrade-requests", user._id]);
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to submit upgrade request",
        color: "red",
      });
    },
  });

  // 处理套餐选择
  const handlePackageSelect = (packageId: string) => {
    form.setFieldValue("requested_package", packageId);
    const selectedPackage = packages.find(p => p.value === packageId);
    if (selectedPackage) {
      form.setFieldValue("amount", selectedPackage.price);
    }
  };

  // 支付截图预览
  useEffect(() => {
    if (!paymentFile) {
      setPaymentPreview(null);
      return;
    }
    const url = URL.createObjectURL(paymentFile);
    setPaymentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [paymentFile]);

  // 头像预览
  useEffect(() => {
    if (!profileFile) {
      setProfilePreview(user?.imageURL || null);
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile, user?.imageURL]);

  // 查看历史记录
  const handleViewHistory = () => {
    setHistoryModalOpened(true);
    fetchHistory();
  };

  if (!user?._id) {
    return (
      <Center style={{ height: "60vh" }}>
        <Text color="red">User not found. Please login again.</Text>
      </Center>
    );
  }

  return (
    <Box p="md">
      <Paper shadow="lg" radius="md" p="xl" mb="md">
        <Title order={2} mb="lg" align="center">
          Profile & Package Management
        </Title>

        {/* 待处理请求提醒 */}
        {pendingRequest && (
          <Alert 
            color="yellow" 
            mb="md" 
            icon={<IconClock size={20} />}
            title="Upgrade Request Pending"
          >
            <Text size="sm">
              You have a pending upgrade request to{" "}
              <Text span weight={600}>
                {packages.find(p => p.value === pendingRequest.requested_package)?.title || "Unknown Package"}
              </Text>
            </Text>
            <Group mt="xs">
              <Badge color="yellow" size="sm">
                {pendingRequest.status}
              </Badge>
              <Text size="xs" color="dimmed">
                Requested on: {new Date(pendingRequest.createdAt).toLocaleDateString()}
              </Text>
            </Group>
          </Alert>
        )}

        {/* 请求历史记录卡片 */}
        {userRequests?.data?.length > 0 && (
          <Card withBorder mb="md" shadow="sm">
            <Group position="apart" mb="md">
              <Text weight={600}>Upgrade Request History</Text>
              <Button 
                size="xs" 
                variant="light"
                onClick={handleViewHistory}
                leftIcon={<IconPhoto size={16} />}
              >
                View Full History
              </Button>
            </Group>
            
            <SimpleGrid spacing="md">
              {userRequests.data.slice(0, 3).map((req: any) => {
                const requestedPkg = packages.find(p => p.value === req.requested_package);
                const currentPkg = packages.find(p => p.value === req.current_package);
                
                return (
                  <Card key={req._id} withBorder p="md" radius="sm">
                    <Group position="apart" mb="xs">
                      <Badge 
                        color={
                          req.status === "approved" ? "green" :
                          req.status === "rejected" ? "red" : "yellow"
                        }
                        size="sm"
                      >
                        {req.status}
                      </Badge>
                      <Text size="xs" color="dimmed">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                    
                    <Text size="sm" weight={500} mb={4}>
                      {requestedPkg?.title || "Unknown"}
                    </Text>
                    
                    <Text size="xs" color="dimmed" mb={2}>
                      From: {currentPkg?.title || "None"}
                    </Text>
                    
                    <Text size="xs" color="dimmed">
                      Amount: PKR {req.amount?.toLocaleString() || "0"}
                    </Text>
                    
                    {req.remarks && (
                      <Text size="xs" mt="xs" color="dimmed" italic>
                        {req.remarks}
                      </Text>
                    )}
                  </Card>
                );
              })}
            </SimpleGrid>
          </Card>
        )}

        {/* 当前套餐信息 */}
        <Card withBorder mb="xl" bg="blue.0">
          <Group position="apart">
            <div>
              <Text size="sm" color="dimmed" mb={4}>Current Package</Text>
              <Text size="xl" weight={700}>
                {currentPackage?.title || "No Package Assigned"}
              </Text>
              {currentPackage && (
                <Text size="sm" color="dimmed">
                  Price: PKR {currentPackage.price.toLocaleString()} | 
                  Commission: To be defined
                </Text>
              )}
            </div>
            <Badge size="lg" color="blue" variant="filled">
              ACTIVE
            </Badge>
          </Group>
        </Card>

        <SimpleGrid  spacing="xl">
          {/* 左侧：个人资料编辑 */}
          <Card withBorder shadow="sm">
            <Title order={3} mb="md">Edit Profile</Title>
            
            <form
              onSubmit={form.onSubmit((values) => {
                updateProfileMutation.mutate(values);
              })}
            >
              <Stack spacing="md">
                <Group position="center">
                  <Avatar
                    src={profilePreview || undefined}
                    size={120}
                    radius="xl"
                    color="blue"
                  />
                  <div>
                    <FileButton
                      onChange={setProfileFile}
                      accept="image/png,image/jpeg,image/webp"
                    >
                      {(props) => (
                        <Button 
                          {...props} 
                          leftIcon={<IconUpload size={16} />}
                          variant="light"
                          size="sm"
                        >
                          Change Photo
                        </Button>
                      )}
                    </FileButton>
                    {profileFile && (
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        mt="xs"
                        onClick={() => setProfileFile(null)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </Group>

                <TextInput
                  label="First Name"
                  placeholder="Enter first name"
                  {...form.getInputProps("firstname")}
                  required
                />
                
                <TextInput
                  label="Last Name"
                  placeholder="Enter last name"
                  {...form.getInputProps("lastname")}
                  required
                />

                <Button
                  type="submit"
                  loading={updateProfileMutation.isLoading}
                  leftIcon={<IconCheck size={16} />}
                >
                  Update Profile
                </Button>
              </Stack>
            </form>
          </Card>

          {/* 右侧：升级请求表单 */}
          <Card withBorder shadow="sm">
            <Title order={3} mb="md">Request Package Upgrade</Title>
            
            <form
              onSubmit={form.onSubmit((values) => {
                if (!paymentFile) {
                  showNotification({
                    title: "Error",
                    message: "Please upload payment screenshot",
                    color: "red",
                  });
                  return;
                }
                upgradeMutation.mutate(values);
              })}
            >
              <Stack spacing="md">
                <Select
                  label="Select Package to Upgrade To"
                  placeholder="Choose a package"
                  data={packages.filter(p => 
                    // 只显示比当前套餐贵的套餐
                    !user.referral_package || 
                    p.price > (currentPackage?.price || 0)
                  )}
                  value={form.values.requested_package}
                  onChange={handlePackageSelect}
                  required
                  disabled={!!pendingRequest}
                  searchable
                  nothingFound="No packages available"
                />

                <TextInput
                  label="Transaction ID"
                  placeholder="Enter payment transaction ID"
                  description="Transaction ID from your payment"
                  {...form.getInputProps("transaction_id")}
                  required
                  disabled={!!pendingRequest}
                />

                <NumberInput
                  label="Amount"
                  placeholder="Amount will be auto-filled"
                  value={form.values.amount}
                  onChange={(value) => form.setFieldValue("amount", value || 0)}
                  min={0}
                  required
                  disabled
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  formatter={(value) =>
                    !Number.isNaN(parseFloat(value || ''))
                      ? `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      : 'PKR '
                  }
                />

                {/* 支付截图上传 */}
                <div>
                  <Text size="sm" weight={500} mb="xs">Payment Proof (Screenshot)</Text>
                  {paymentPreview ? (
                    <Card withBorder p="md">
                      <Group position="apart">
                        <Group>
                          <Image
                            src={paymentPreview}
                            alt="Payment proof"
                            width={80}
                            height={80}
                            radius="sm"
                            withPlaceholder
                          />
                          <Text size="sm" color="dimmed">Payment screenshot uploaded</Text>
                        </Group>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => setPaymentFile(null)}
                          leftIcon={<IconX size={14} />}
                        >
                          Remove
                        </Button>
                      </Group>
                    </Card>
                  ) : (
                    <FileButton
                      onChange={setPaymentFile}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!!pendingRequest}
                    >
                      {(props) => (
                        <Button 
                          {...props} 
                          variant="light" 
                          leftIcon={<IconUpload size={16} />}
                          fullWidth
                        >
                          Upload Payment Screenshot
                        </Button>
                      )}
                    </FileButton>
                  )}
                  <Text size="xs" color="dimmed" mt={4}>
                    Upload clear screenshot of payment confirmation
                  </Text>
                </div>

                <Button
                  type="submit"
                  loading={upgradeMutation.isLoading}
                  disabled={!!pendingRequest || !paymentFile}
                  leftIcon={<IconUpload size={16} />}
                  fullWidth
                  size="lg"
                  color="blue"
                >
                  {pendingRequest ? "Request Pending" : "Submit Upgrade Request"}
                </Button>

                {pendingRequest && (
                  <Text size="sm" color="orange" align="center">
                    You have a pending request. Please wait for admin approval.
                  </Text>
                )}
              </Stack>
            </form>
          </Card>
        </SimpleGrid>
      </Paper>

      {/* 历史记录模态框 */}
      <Modal
        opened={historyModalOpened}
        onClose={() => setHistoryModalOpened(false)}
        title="Upgrade History Timeline"
        size="lg"
      >
        {historyLoading ? (
          <Center p="xl">
            <Loader />
          </Center>
        ) : upgradeHistory?.data ? (
          <Timeline active={upgradeHistory.data.length - 1} bulletSize={24} lineWidth={2}>
            {upgradeHistory.data.map((req: any, index: number) => {
              const requestedPkg = packages.find(p => p.value === req.requested_package);
              const currentPkg = packages.find(p => p.value === req.current_package);
              
              return (
                <Timeline.Item 
                  key={req._id}
                  title={
                    <Text weight={600} size="lg">
                      {requestedPkg?.title || "Unknown Package"}
                    </Text>
                  }
                  bullet={
                    <Badge 
                      size="xs" 
                      radius="xl"
                      color={
                        req.status === "approved" ? "green" :
                        req.status === "rejected" ? "red" : "yellow"
                      }
                    >
                      {index + 1}
                    </Badge>
                  }
                >
                  <Group spacing="xs" mb={4}>
                    <Badge 
                      color={
                        req.status === "approved" ? "green" :
                        req.status === "rejected" ? "red" : "yellow"
                      }
                    >
                      {req.status?.toUpperCase()}
                    </Badge>
                    <Text size="sm" color="dimmed">
                      {new Date(req.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                  
                  <SimpleGrid cols={2} spacing="xs" mb="xs">
                    <div>
                      <Text size="sm" color="dimmed">From:</Text>
                      <Text>{currentPkg?.title || "None"}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">To:</Text>
                      <Text>{requestedPkg?.title || "N/A"}</Text>
                    </div>
                  </SimpleGrid>
                  
                  <Group spacing="lg">
                    <Text size="sm">
                      <Text span color="dimmed">Amount: </Text>
                      PKR {req.amount?.toLocaleString() || "0"}
                    </Text>
                    <Text size="sm">
                      <Text span color="dimmed">Transaction: </Text>
                      {req.transaction_id}
                    </Text>
                  </Group>
                  
                  {req.remarks && (
                    <Card mt="xs" p="xs" bg="gray.0">
                      <Text size="sm">
                        <Text span weight={500}>Remarks: </Text>
                        {req.remarks}
                      </Text>
                    </Card>
                  )}
                </Timeline.Item>
              );
            })}
          </Timeline>
        ) : (
          <Text color="dimmed" align="center" py="xl">
            No upgrade history found.
          </Text>
        )}
      </Modal>
    </Box>
  );
}