import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axiosConfig from "../configs/axios";
import { showNotification } from "@mantine/notifications";
import {
  Button,
  Modal,
  Textarea,
  Group,
  Badge,
  Card,
  Text,
  SimpleGrid,
  Timeline,
  Loader,
  Center,
  Image,
  Tabs,
  Box,
  Title,
  Stack,
  Paper,
  Avatar,
  Tooltip,
  ActionIcon,
  ScrollArea,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import {
  IconCheck,
  IconX,
  IconEye,
  IconHistory,
  IconPackage,
  IconRefresh,
  IconCash,
  IconUser,
  IconReceipt,
  IconCalendar,
} from "@tabler/icons-react";

export function AdminPackageRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<"activation" | "upgrade">("activation");
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [remarks, setRemarks] = useState("");
  const [viewHistoryModal, setViewHistoryModal] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [activeActivationTab, setActiveActivationTab] = useState<string>("all");
  const [activeUpgradeTab, setActiveUpgradeTab] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const currentAdmin = JSON.parse(sessionStorage.getItem("user") || "{}");

  // 获取激活请求
  const { 
    data: activationData, 
    isLoading: loadingActivations,
    refetch: refetchActivations 
  } = useQuery({
    queryKey: ["activation-requests"],
    queryFn: async () => {
      const res = await axiosConfig.get("/package-activations");
      return res.data;
    },
  });

  // 获取升级请求
  const { 
    data: upgradeData, 
    isLoading: loadingUpgrades,
    refetch: refetchUpgrades 
  } = useQuery({
    queryKey: ["upgrade-requests"],
    queryFn: async () => {
      const res = await axiosConfig.get("/package-upgrades");
      return res.data;
    },
  });

  // 获取用户历史记录
  const { 
    data: requestHistory, 
    isLoading: historyLoading,
    refetch: fetchHistory 
  } = useQuery({
    queryKey: ["request-history", selectedRequest?.user?._id],
    queryFn: async () => {
      if (!selectedRequest?.user?._id) return null;
      const res = await axiosConfig.get(`/package-activations/history/${selectedRequest.user._id}`);
      return res.data;
    },
    enabled: false,
  });

  // 处理激活请求
  const processActivationMutation = useMutation({
    mutationFn: async (data: { 
      requestId: string; 
      action: string; 
      remarks?: string 
    }) => {
      const res = await axiosConfig.put(`/package-activations/${data.requestId}/process`, {
        action: data.action,
        remarks: data.remarks,
        processed_by: currentAdmin._id,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification({
        title: "Success",
        message: "Activation request processed successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      setActionModalOpened(false);
      setRemarks("");
      refetchActivations();
      queryClient.invalidateQueries(["activation-requests"]);
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to process request",
        color: "red",
        icon: <IconX size={16} />,
      });
    },
  });

  // 处理升级请求
  const processUpgradeMutation = useMutation({
    mutationFn: async (data: { 
      requestId: string; 
      action: string; 
      remarks?: string 
    }) => {
      const res = await axiosConfig.put(`/package-upgrades/${data.requestId}/process`, {
        action: data.action,
        remarks: data.remarks,
        processed_by: currentAdmin._id,
      });
      return res.data;
    },
    onSuccess: () => {
      showNotification({
        title: "Success",
        message: "Upgrade request processed successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
      setActionModalOpened(false);
      setRemarks("");
      refetchUpgrades();
      queryClient.invalidateQueries(["upgrade-requests"]);
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to process request",
        color: "red",
        icon: <IconX size={16} />,
      });
    },
  });

  // 获取激活请求数据
  const activationRequests = useMemo(() => {
    if (!activationData || !activationData.success) return [];
    
    // 检查各种可能的响应格式
    if (Array.isArray(activationData.data?.data)) {
      return activationData.data.data;
    } else if (Array.isArray(activationData.data?.docs)) {
      return activationData.data.docs;
    } else if (Array.isArray(activationData.data)) {
      return activationData.data;
    }
    
    return [];
  }, [activationData]);

  // 获取升级请求数据
  const upgradeRequests = useMemo(() => {
    if (!upgradeData || !upgradeData.success) return [];
    
    // 检查各种可能的响应格式
    if (Array.isArray(upgradeData.data?.docs)) {
      return upgradeData.data.docs;
    } else if (Array.isArray(upgradeData.data?.data)) {
      return upgradeData.data.data;
    } else if (Array.isArray(upgradeData.data)) {
      return upgradeData.data;
    }
    
    return [];
  }, [upgradeData]);

  // 获取当前显示的激活请求数据
  const getFilteredActivationRequests = () => {
    if (!Array.isArray(activationRequests)) return [];
    
    if (activeActivationTab === "all") return activationRequests;
    return activationRequests.filter((req: any) => req.status === activeActivationTab);
  };

  // 获取当前显示的升级请求数据
  const getFilteredUpgradeRequests = () => {
    if (!Array.isArray(upgradeRequests)) return [];
    
    if (activeUpgradeTab === "all") return upgradeRequests;
    return upgradeRequests.filter((req: any) => req.status === activeUpgradeTab);
  };

  // 统计信息
  const stats = useMemo(() => {
    const allRequests = [...activationRequests, ...upgradeRequests];
    
    return {
      total: allRequests.length,
      pending: allRequests.filter((r: any) => r.status === 'pending').length,
      approved: allRequests.filter((r: any) => r.status === 'approved').length,
      rejected: allRequests.filter((r: any) => r.status === 'rejected').length,
      activations: activationRequests.length,
      upgrades: upgradeRequests.length,
    };
  }, [activationRequests, upgradeRequests]);

  // 激活请求表格列
  const activationColumns = [
    { 
      accessor: "user", 
      title: "User", 
      width: 180,
      render: (item: any) => (
        <Group spacing="xs">
          <Avatar size="sm" radius="xl" color="blue">
            {item.user?.firstname?.charAt(0) || "U"}
          </Avatar>
          <div>
            <Text size="sm" weight={500}>
              {`${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() || "Unknown"}
            </Text>
            <Text size="xs" color="dimmed">
              {item.user?.user_code || "No code"}
            </Text>
          </div>
        </Group>
      )
    },
    { 
      accessor: "requested_package", 
      title: "Requested Package", 
      width: 150,
      render: (item: any) => (
        <Tooltip label={`Price: PKR ${item.requested_package?.price?.toLocaleString() || '0'}`}>
          <Badge variant="outline" color="blue">
            {item.requested_package?.title || "N/A"}
          </Badge>
        </Tooltip>
      )
    },
    { 
      accessor: "amount", 
      title: "Amount", 
      width: 120,
      render: (item: any) => (
        <Group spacing={4}>
          <IconCash size={14} />
          <Text weight={600}>PKR {item.amount?.toLocaleString() || "0"}</Text>
        </Group>
      )
    },
    { 
      accessor: "transaction_id", 
      title: "Transaction ID",
      width: 200,
      render: (item: any) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }} truncate>
          {item.transaction_id}
        </Text>
      )
    },
    { 
      accessor: "status", 
      title: "Status", 
      width: 120,
      render: (item: any) => {
        const status = item.status || "pending";
        const colorMap: any = {
          "approved": "green",
          "rejected": "red",
          "pending": "yellow"
        };
        
        return (
          <Badge 
            color={colorMap[status] || "gray"}
            variant="filled"
            size="md"
          >
            {status.toUpperCase()}
          </Badge>
        );
      }
    },
    { 
      accessor: "createdAt", 
      title: "Date", 
      width: 130,
      render: (item: any) => (
        <Group spacing={4}>
          <IconCalendar size={14} />
          <Text size="sm">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Group>
      )
    },
    {
      accessor: "actions",
      title: "Actions",
      width: 220,
      render: (item: any) => {
        const isPending = item.status === "pending";
        
        return (
          <Group spacing={4}>
            <Tooltip label="View Details">
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("activation");
                  setViewDetailsModal(true);
                }}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="View History">
              <ActionIcon
                color="violet"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("activation");
                  setViewHistoryModal(true);
                  fetchHistory();
                }}
              >
                <IconHistory size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Approve">
              <ActionIcon
                color="green"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("activation");
                  setActionType("approve");
                  setActionModalOpened(true);
                }}
                disabled={!isPending}
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Reject">
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("activation");
                  setActionType("reject");
                  setActionModalOpened(true);
                }}
                disabled={!isPending}
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  // 升级请求表格列
  const upgradeColumns = [
    { 
      accessor: "user", 
      title: "User", 
      width: 180,
      render: (item: any) => (
        <Group spacing="xs">
          <Avatar size="sm" radius="xl" color="orange">
            {item.user?.firstname?.charAt(0) || "U"}
          </Avatar>
          <div>
            <Text size="sm" weight={500}>
              {`${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() || "Unknown"}
            </Text>
            <Text size="xs" color="dimmed">
              {item.user?.user_code || "No code"}
            </Text>
          </div>
        </Group>
      )
    },
    { 
      accessor: "current_package", 
      title: "From", 
      width: 120,
      render: (item: any) => (
        <Tooltip label={`Current: ${item.current_package?.title || 'None'}`}>
          <Badge variant="dot" color="gray">
            {item.current_package?.title || "None"}
          </Badge>
        </Tooltip>
      )
    },
    { 
      accessor: "requested_package", 
      title: "To", 
      width: 120,
      render: (item: any) => (
        <Tooltip label={`New: ${item.requested_package?.title || 'N/A'}`}>
          <Badge variant="outline" color="orange">
            {item.requested_package?.title || "N/A"}
          </Badge>
        </Tooltip>
      )
    },
    { 
      accessor: "amount", 
      title: "Amount", 
      width: 120,
      render: (item: any) => (
        <Group spacing={4}>
          <IconCash size={14} />
          <Text weight={600}>PKR {item.amount?.toLocaleString() || "0"}</Text>
        </Group>
      )
    },
    { 
      accessor: "transaction_id", 
      title: "Transaction ID",
      width: 200,
      render: (item: any) => (
        <Text size="sm" style={{ fontFamily: 'monospace' }} truncate>
          {item.transaction_id}
        </Text>
      )
    },
    { 
      accessor: "status", 
      title: "Status", 
      width: 120,
      render: (item: any) => {
        const status = item.status || "pending";
        const colorMap: any = {
          "approved": "green",
          "rejected": "red",
          "pending": "yellow"
        };
        
        return (
          <Badge 
            color={colorMap[status] || "gray"}
            variant="filled"
            size="md"
          >
            {status.toUpperCase()}
          </Badge>
        );
      }
    },
    { 
      accessor: "createdAt", 
      title: "Date", 
      width: 130,
      render: (item: any) => (
        <Group spacing={4}>
          <IconCalendar size={14} />
          <Text size="sm">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </Group>
      )
    },
    {
      accessor: "actions",
      title: "Actions",
      width: 220,
      render: (item: any) => {
        const isPending = item.status === "pending";
        
        return (
          <Group spacing={4}>
            <Tooltip label="View Details">
              <ActionIcon
                color="blue"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("upgrade");
                  setViewDetailsModal(true);
                }}
              >
                <IconEye size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="View History">
              <ActionIcon
                color="violet"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("upgrade");
                  setViewHistoryModal(true);
                  fetchHistory();
                }}
              >
                <IconHistory size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Approve">
              <ActionIcon
                color="green"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("upgrade");
                  setActionType("approve");
                  setActionModalOpened(true);
                }}
                disabled={!isPending}
              >
                <IconCheck size={16} />
              </ActionIcon>
            </Tooltip>
            
            <Tooltip label="Reject">
              <ActionIcon
                color="red"
                variant="light"
                onClick={() => {
                  setSelectedRequest(item);
                  setSelectedRequestType("upgrade");
                  setActionType("reject");
                  setActionModalOpened(true);
                }}
                disabled={!isPending}
              >
                <IconX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

  // Main tab change handler
  const handleMainTabChange = (value: string | null) => {
    if (value === "activation" || value === "upgrade") {
      setSelectedRequestType(value);
    }
  };

  // Activation tab change handler
  const handleActivationTabChange = (value: string | null) => {
    setActiveActivationTab(value || "all");
  };

  // Upgrade tab change handler
  const handleUpgradeTabChange = (value: string | null) => {
    setActiveUpgradeTab(value || "all");
  };

  return (
    <Box p="md">
      <Stack spacing="md">
        {/* Header */}
        <Group position="apart">
          <div>
            <Title order={2}>Package Management</Title>
            <Text color="dimmed">Manage all package activation and upgrade requests</Text>
          </div>
          
          <Group>
            <Button
              leftIcon={<IconRefresh size={16} />}
              onClick={() => {
                refetchActivations();
                refetchUpgrades();
              }}
              variant="light"
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Stats Cards */}
        <SimpleGrid cols={4}>
          <Paper withBorder p="md" radius="md">
            <Group position="apart">
              <div>
                <Text color="dimmed" size="sm">Total Requests</Text>
                <Text size="xl" weight={700}>{stats.total}</Text>
              </div>
              <Avatar color="blue" radius="xl">
                <IconPackage size={24} />
              </Avatar>
            </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
            <Group position="apart">
              <div>
                <Text color="dimmed" size="sm">Pending</Text>
                <Text size="xl" weight={700} color="orange">{stats.pending}</Text>
              </div>
              <Avatar color="orange" radius="xl">
                <IconReceipt size={24} />
              </Avatar>
            </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
            <Group position="apart">
              <div>
                <Text color="dimmed" size="sm">Activations</Text>
                <Text size="xl" weight={700} color="blue">{stats.activations}</Text>
              </div>
              <Avatar color="blue" radius="xl">
                <IconCheck size={24} />
              </Avatar>
            </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
            <Group position="apart">
              <div>
                <Text color="dimmed" size="sm">Upgrades</Text>
                <Text size="xl" weight={700} color="orange">{stats.upgrades}</Text>
              </div>
              <Avatar color="orange" radius="xl">
                <IconRefresh size={24} />
              </Avatar>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Main Content */}
        <Paper withBorder radius="md">
          <Tabs 
            value={selectedRequestType} 
            onTabChange={handleMainTabChange}
          >
            <Tabs.List grow>
              <Tabs.Tab 
                value="activation" 
                icon={<IconCheck size={16} />}
                rightSection={
                  <Badge size="sm" variant="filled" color="blue">
                    {stats.activations}
                  </Badge>
                }
              >
                Activation Requests
              </Tabs.Tab>
              <Tabs.Tab 
                value="upgrade" 
                icon={<IconRefresh size={16} />}
                rightSection={
                  <Badge size="sm" variant="filled" color="orange">
                    {stats.upgrades}
                  </Badge>
                }
              >
                Upgrade Requests
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="activation" pt="md">
              <Tabs 
                value={activeActivationTab} 
                onTabChange={handleActivationTabChange}
                mb="md"
              >
                <Tabs.List>
                  <Tabs.Tab value="all">All ({activationRequests.length})</Tabs.Tab>
                  <Tabs.Tab value="pending">
                    Pending ({activationRequests.filter((r: any) => r.status === 'pending').length})
                  </Tabs.Tab>
                  <Tabs.Tab value="approved">
                    Approved ({activationRequests.filter((r: any) => r.status === 'approved').length})
                  </Tabs.Tab>
                  <Tabs.Tab value="rejected">
                    Rejected ({activationRequests.filter((r: any) => r.status === 'rejected').length})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
              
              <DataTable
                idAccessor="_id"
                columns={activationColumns}
                records={getFilteredActivationRequests()}
                fetching={loadingActivations}
                minHeight={400}
                noRecordsText="No activation requests found"
                highlightOnHover
                striped
                withBorder
                withColumnBorders
              />
            </Tabs.Panel>

            <Tabs.Panel value="upgrade" pt="md">
              <Tabs 
                value={activeUpgradeTab} 
                onTabChange={handleUpgradeTabChange}
                mb="md"
              >
                <Tabs.List>
                  <Tabs.Tab value="all">All ({upgradeRequests.length})</Tabs.Tab>
                  <Tabs.Tab value="pending">
                    Pending ({upgradeRequests.filter((r: any) => r.status === 'pending').length})
                  </Tabs.Tab>
                  <Tabs.Tab value="approved">
                    Approved ({upgradeRequests.filter((r: any) => r.status === 'approved').length})
                  </Tabs.Tab>
                  <Tabs.Tab value="rejected">
                    Rejected ({upgradeRequests.filter((r: any) => r.status === 'rejected').length})
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
              
              <DataTable
                idAccessor="_id"
                columns={upgradeColumns}
                records={getFilteredUpgradeRequests()}
                fetching={loadingUpgrades}
                minHeight={400}
                noRecordsText="No upgrade requests found"
                highlightOnHover
                striped
                withBorder
                withColumnBorders
              />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Stack>

      {/* Action Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={() => setActionModalOpened(false)}
        title={`${actionType === "approve" ? "Approve" : "Reject"} ${selectedRequestType === "activation" ? "Activation" : "Upgrade"} Request`}
        size="lg"
      >
        {selectedRequest && (
          <Stack spacing="md">
            <Card withBorder>
              <Group position="apart">
                <div>
                  <Text size="sm" color="dimmed">User</Text>
                  <Text weight={600}>
                    {selectedRequest.user?.firstname} {selectedRequest.user?.lastname}
                  </Text>
                  <Text size="sm" color="dimmed">{selectedRequest.user?.user_code}</Text>
                </div>
                <Avatar color={selectedRequestType === "activation" ? "blue" : "orange"}>
                  <IconUser size={24} />
                </Avatar>
              </Group>
            </Card>

            <SimpleGrid cols={2}>
              {selectedRequestType === "upgrade" && (
                <div>
                  <Text size="sm" color="dimmed">Current Package</Text>
                  <Badge size="lg" variant="outline">
                    {selectedRequest.current_package?.title || "None"}
                  </Badge>
                </div>
              )}
              <div>
                <Text size="sm" color="dimmed">
                  {selectedRequestType === "activation" ? "Requested Package" : "Upgrade To"}
                </Text>
                <Badge size="lg" color={selectedRequestType === "activation" ? "blue" : "orange"}>
                  {selectedRequest.requested_package?.title || "N/A"}
                </Badge>
              </div>
              <div>
                <Text size="sm" color="dimmed">Amount</Text>
                <Group spacing={4}>
                  <IconCash size={16} />
                  <Text weight={600}>PKR {selectedRequest.amount?.toLocaleString() || "0"}</Text>
                </Group>
              </div>
              <div>
                <Text size="sm" color="dimmed">Transaction ID</Text>
                <Text style={{ fontFamily: "monospace" }}>{selectedRequest.transaction_id}</Text>
              </div>
            </SimpleGrid>

            {/* Payment Screenshot Preview */}
            {selectedRequest.paymentScreenshotURL && (
              <div>
                <Text size="sm" color="dimmed" mb="xs">Payment Screenshot:</Text>
                <Image 
                  src={selectedRequest.paymentScreenshotURL} 
                  alt="Payment Screenshot"
                  radius="md"
                  withPlaceholder
                  height={200}
                  fit="contain"
                />
              </div>
            )}

            <Textarea
              label="Remarks"
              placeholder={actionType === "approve" 
                ? "Add approval remarks (optional)" 
                : "Please provide reason for rejection"}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              autosize
              minRows={3}
            />

            <Group position="right" mt="md">
              <Button 
                variant="outline" 
                onClick={() => {
                  setActionModalOpened(false);
                  setRemarks("");
                }}
              >
                Cancel
              </Button>
              <Button
                color={actionType === "approve" ? "green" : "red"}
                leftIcon={actionType === "approve" ? <IconCheck size={16} /> : <IconX size={16} />}
                onClick={() => {
                  if (selectedRequestType === "activation") {
                    processActivationMutation.mutate({
                      requestId: selectedRequest._id,
                      action: actionType,
                      remarks: remarks.trim() || undefined,
                    });
                  } else {
                    processUpgradeMutation.mutate({
                      requestId: selectedRequest._id,
                      action: actionType,
                      remarks: remarks.trim() || undefined,
                    });
                  }
                }}
                loading={processActivationMutation.isLoading || processUpgradeMutation.isLoading}
              >
                {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        opened={viewDetailsModal}
        onClose={() => setViewDetailsModal(false)}
        title={`${selectedRequestType === "activation" ? "Activation" : "Upgrade"} Request Details`}
        size="lg"
      >
        {selectedRequest && (
          <Stack spacing="md">
            <Card withBorder>
              <Group position="apart">
                <div>
                  <Text size="xl" weight={700}>
                    {selectedRequest.user?.firstname} {selectedRequest.user?.lastname}
                  </Text>
                  <Text color="dimmed">{selectedRequest.user?.email}</Text>
                  <Text color="dimmed">User Code: {selectedRequest.user?.user_code}</Text>
                </div>
                <Avatar size="lg">
                  {selectedRequest.user?.firstname?.charAt(0)}
                </Avatar>
              </Group>
            </Card>

            <SimpleGrid cols={2}>
              <div>
                <Text size="sm" color="dimmed">Request Type</Text>
                <Badge 
                  size="lg" 
                  color={selectedRequestType === "activation" ? "blue" : "orange"}
                  variant="filled"
                >
                  {selectedRequestType === "activation" ? "Activation" : "Upgrade"}
                </Badge>
              </div>
              <div>
                <Text size="sm" color="dimmed">Status</Text>
                <Badge 
                  size="lg" 
                  color={
                    selectedRequest.status === "approved" ? "green" :
                    selectedRequest.status === "rejected" ? "red" : "yellow"
                  }
                >
                  {selectedRequest.status?.toUpperCase()}
                </Badge>
              </div>
              {selectedRequestType === "upgrade" && (
                <>
                  <div>
                    <Text size="sm" color="dimmed">Current Package</Text>
                    <Text weight={600}>{selectedRequest.current_package?.title || "None"}</Text>
                    {selectedRequest.current_package?.price && (
                      <Text size="sm" color="dimmed">
                        PKR {selectedRequest.current_package.price.toLocaleString()}
                      </Text>
                    )}
                  </div>
                  <div>
                    <Text size="sm" color="dimmed">Requested Package</Text>
                    <Text weight={600}>{selectedRequest.requested_package?.title || "N/A"}</Text>
                    {selectedRequest.requested_package?.price && (
                      <Text size="sm" color="dimmed">
                        PKR {selectedRequest.requested_package.price.toLocaleString()}
                      </Text>
                    )}
                  </div>
                </>
              )}
              {selectedRequestType === "activation" && (
                <div>
                  <Text size="sm" color="dimmed">Requested Package</Text>
                  <Text weight={600}>{selectedRequest.requested_package?.title || "N/A"}</Text>
                  {selectedRequest.requested_package?.price && (
                    <Text size="sm" color="dimmed">
                      PKR {selectedRequest.requested_package.price.toLocaleString()}
                    </Text>
                  )}
                </div>
              )}
              <div>
                <Text size="sm" color="dimmed">Amount</Text>
                <Group spacing={4}>
                  <IconCash size={16} />
                  <Text size="lg" weight={700}>
                    PKR {selectedRequest.amount?.toLocaleString() || "0"}
                  </Text>
                </Group>
              </div>
              <div>
                <Text size="sm" color="dimmed">Transaction ID</Text>
                <Text style={{ fontFamily: "monospace" }}>{selectedRequest.transaction_id}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">Request Date</Text>
                <Text>{new Date(selectedRequest.createdAt).toLocaleString()}</Text>
              </div>
              {selectedRequest.processed_by && (
                <div>
                  <Text size="sm" color="dimmed">Processed By</Text>
                  <Text>
                    {selectedRequest.processed_by?.firstname} {selectedRequest.processed_by?.lastname}
                  </Text>
                </div>
              )}
            </SimpleGrid>

            {/* Payment Proof */}
            {selectedRequest.paymentScreenshotURL && (
              <div>
                <Text size="sm" color="dimmed" mb="xs">Payment Proof:</Text>
                <Card withBorder p={0}>
                  <Image 
                    src={selectedRequest.paymentScreenshotURL} 
                    alt="Payment Screenshot"
                    height={300}
                    fit="contain"
                  />
                </Card>
              </div>
            )}

            {/* Remarks */}
            {selectedRequest.remarks && (
              <div>
                <Text size="sm" color="dimmed">Remarks:</Text>
                <Card withBorder bg="gray.0">
                  <Text>{selectedRequest.remarks}</Text>
                </Card>
              </div>
            )}
          </Stack>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        opened={viewHistoryModal}
        onClose={() => {
          setViewHistoryModal(false);
          setSelectedRequest(null);
        }}
        title="Package History"
        size="xl"
      >
        {historyLoading ? (
          <Center>
            <Loader />
          </Center>
        ) : requestHistory?.data ? (
          <ScrollArea style={{ height: 500 }}>
            <Timeline active={requestHistory.data.length - 1} bulletSize={24} lineWidth={2}>
              {requestHistory.data.map((req: any, index: number) => (
                <Timeline.Item 
                  key={req._id || index}
                  bullet={
                    <Avatar 
                      size={24} 
                      color={
                        req.status === "approved" ? "green" :
                        req.status === "rejected" ? "red" : "blue"
                      }
                    >
                      {index + 1}
                    </Avatar>
                  }
                  title={
                    <Group spacing="xs">
                      <Text weight={600}>
                        {req.request_type === "activation" ? "Activation" : "Upgrade"}
                      </Text>
                      <Badge 
                        size="sm" 
                        color={
                          req.status === "approved" ? "green" :
                          req.status === "rejected" ? "red" : "yellow"
                        }
                      >
                        {req.status?.toUpperCase()}
                      </Badge>
                    </Group>
                  }
                >
                  <Card withBorder p="sm">
                    <SimpleGrid cols={2} spacing="sm">
                      <div>
                        <Text size="xs" color="dimmed">Package</Text>
                        <Text size="sm" weight={500}>
                          {req.requested_package?.title || "Unknown"}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed">Amount</Text>
                        <Text size="sm" weight={500}>
                          PKR {req.amount?.toLocaleString() || "0"}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed">Transaction ID</Text>
                        <Text size="sm" style={{ fontFamily: 'monospace' }}>
                          {req.transaction_id}
                        </Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed">Date</Text>
                        <Text size="sm">
                          {new Date(req.createdAt).toLocaleString()}
                        </Text>
                      </div>
                    </SimpleGrid>
                    
                    {req.remarks && (
                      <Box mt="sm">
                        <Text size="xs" color="dimmed">Remarks</Text>
                        <Text size="sm">{req.remarks}</Text>
                      </Box>
                    )}
                  </Card>
                </Timeline.Item>
              ))}
            </Timeline>
          </ScrollArea>
        ) : (
          <Text color="dimmed" align="center" py="xl">
            No history found for this user.
          </Text>
        )}
      </Modal>
    </Box>
  );
}

export default AdminPackageRequests;