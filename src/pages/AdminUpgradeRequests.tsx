// components/AdminUpgradeRequests.tsx
import { useState } from "react";
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
} from "@mantine/core";
import { DataTable } from "mantine-datatable";

export function AdminUpgradeRequests() {
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionModalOpened, setActionModalOpened] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [remarks, setRemarks] = useState("");
  const [viewHistoryModal, setViewHistoryModal] = useState(false);
  
  const queryClient = useQueryClient();
  const currentAdmin = JSON.parse(sessionStorage.getItem("user") || "{}");

  // Fetch all upgrade requests
  const { 
    data: requests, 
    isLoading,
    error 
  } = useQuery({
    queryKey: ["upgrade-requests"],
    queryFn: async () => {
      const res = await axiosConfig.get("/package-upgrades");
      return res.data;
    },
  });

  // View request history - 仅在需要时获取
  const { 
    data: requestHistory, 
    isLoading: historyLoading,
    refetch: fetchHistory 
  } = useQuery({
    queryKey: ["request-history", selectedRequest?.user?._id],
    queryFn: async () => {
      if (!selectedRequest?.user?._id) return null;
      const res = await axiosConfig.get(`/package-upgrades/history/${selectedRequest.user._id}`);
      return res.data;
    },
    enabled: false, // 手动触发
  });

  // Process request mutation
  const processMutation = useMutation({
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
        message: "Request processed successfully",
        color: "green",
      });
      setActionModalOpened(false);
      setRemarks("");
      queryClient.invalidateQueries(["upgrade-requests"]);
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to process request",
        color: "red",
      });
    },
  });

  const columns = [
    { 
      accessor: "user", 
      title: "User", 
      render: (item: any) => `${item.user?.firstname || ""} ${item.user?.lastname || ""}`.trim() || "Unknown"
    },
    { 
      accessor: "current_package", 
      title: "Current", 
      render: (item: any) => item.current_package?.title || "None" 
    },
    { 
      accessor: "requested_package", 
      title: "Requested", 
      render: (item: any) => item.requested_package?.title || "N/A" 
    },
    { 
      accessor: "amount", 
      title: "Amount", 
      render: (item: any) => `PKR ${item.amount?.toLocaleString() || "0"}` 
    },
    { 
      accessor: "transaction_id", 
      title: "Transaction ID" 
    },
    { 
      accessor: "status", 
      title: "Status", 
      render: (item: any) => {
        const status = item.status || "pending";
        const colorMap: any = {
          "approved": "green",
          "rejected": "red",
          "processing": "blue",
          "pending": "yellow"
        };
        
        return (
          <Badge color={colorMap[status] || "gray"}>
            {status.toUpperCase()}
          </Badge>
        );
      }
    },
    { 
      accessor: "createdAt", 
      title: "Requested On", 
      render: (item: any) => new Date(item.createdAt).toLocaleDateString() 
    },
    {
      accessor: "actions",
      title: "Actions",
      render: (item: any) => {
        const isPending = item.status === "pending";
        
        return (
          <Group spacing="xs">
            <Button 
              size="xs" 
              onClick={() => {
                setSelectedRequest(item);
                setActionType("approve");
                setActionModalOpened(true);
              }} 
              disabled={!isPending}
            >
              Approve
            </Button>
            <Button 
              size="xs" 
              color="red" 
              variant="light" 
              onClick={() => {
                setSelectedRequest(item);
                setActionType("reject");
                setActionModalOpened(true);
              }} 
              disabled={!isPending}
            >
              Reject
            </Button>
            <Button 
              size="xs"
              variant="subtle"
              onClick={() => {
                setSelectedRequest(item);
                setViewHistoryModal(true);
                fetchHistory();
              }}
            >
              View History
            </Button>
          </Group>
        );
      },
    },
  ];

  if (error) {
    return (
      <Center>
        <Text color="red">Error loading upgrade requests: {(error as any).message}</Text>
      </Center>
    );
  }

  return (
    <div>
      <DataTable
        columns={columns}
        records={requests?.data?.docs || requests?.data?.data || requests?.data || []}
        fetching={isLoading}
        minHeight={300}
        noRecordsText="No upgrade requests found"
        highlightOnHover
        onRowClick={(request: any) => setSelectedRequest(request)}
      />

      {/* Action Modal */}
      <Modal
        opened={actionModalOpened}
        onClose={() => setActionModalOpened(false)}
        title={`${actionType === "approve" ? "Approve" : "Reject"} Upgrade Request`}
      >
        {selectedRequest && (
          <div>
            <Text mb="md">
              {actionType === "approve" ? "Approve" : "Reject"} request from{" "}
              {selectedRequest.user?.firstname} {selectedRequest.user?.lastname}?
            </Text>
            
            <SimpleGrid cols={2} mb="md">
              <div>
                <Text size="sm" color="dimmed">Current Package</Text>
                <Text>{selectedRequest.current_package?.title || "None"}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">Requested Package</Text>
                <Text>{selectedRequest.requested_package?.title || "N/A"}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">Amount</Text>
                <Text>PKR {selectedRequest.amount?.toLocaleString() || "0"}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">Transaction ID</Text>
                <Text style={{ fontFamily: "monospace" }}>{selectedRequest.transaction_id}</Text>
              </div>
            </SimpleGrid>

            {/* Payment Screenshot Preview */}
            {selectedRequest.paymentScreenshotURL && (
              <div style={{ marginBottom: "1rem" }}>
                <Text size="sm" color="dimmed" mb="xs">Payment Screenshot:</Text>
                <Image 
                  src={selectedRequest.paymentScreenshotURL} 
                  alt="Payment Screenshot"
                  width={200}
                  height={150}
                  fit="contain"
                  radius="sm"
                  withPlaceholder
                />
              </div>
            )}

            <Textarea
              label="Remarks (Optional)"
              placeholder={actionType === "approve" ? "Add any remarks..." : "Reason for rejection..."}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              mb="md"
              autosize
              minRows={2}
            />

            <Group position="right">
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
                onClick={() => {
                  processMutation.mutate({
                    requestId: selectedRequest._id,
                    action: actionType,
                    remarks: remarks.trim() || undefined,
                  });
                }}
                loading={processMutation.isLoading}
              >
                {actionType === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </Group>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        opened={viewHistoryModal}
        onClose={() => {
          setViewHistoryModal(false);
          setSelectedRequest(null);
        }}
        title="Upgrade History"
        size="lg"
      >
        {historyLoading ? (
          <Center>
            <Loader />
          </Center>
        ) : requestHistory?.data ? (
          <>
            <Text size="sm" color="dimmed" mb="md">
              History for {selectedRequest?.user?.firstname} {selectedRequest?.user?.lastname}
            </Text>
            
            <Timeline active={requestHistory.data.length - 1} bulletSize={24} lineWidth={2}>
              {requestHistory.data.map((req: any, index: number) => (
                <Timeline.Item 
                  key={req._id} 
                  title={
                    <Text weight={500}>
                      {req.requested_package?.title || "Unknown Package"}
                    </Text>
                  }
                  bullet={
                    <Badge 
                      size="xs" 
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
                      size="sm" 
                      color={
                        req.status === "approved" ? "green" :
                        req.status === "rejected" ? "red" : "yellow"
                      }
                    >
                      {req.status?.toUpperCase()}
                    </Badge>
                    <Text size="xs" color="dimmed">
                      {new Date(req.createdAt).toLocaleString()}
                    </Text>
                  </Group>
                  
                  {req.current_package && (
                    <Text size="sm">
                      <Text span color="dimmed">From: </Text>
                      {req.current_package.title} 
                      {req.current_package.price && (
                        <Text span color="dimmed"> (PKR {req.current_package.price.toLocaleString()})</Text>
                      )}
                    </Text>
                  )}
                  
                  <Text size="sm">
                    <Text span color="dimmed">To: </Text>
                    {req.requested_package?.title || "N/A"} 
                    {req.requested_package?.price && (
                      <Text span color="dimmed"> (PKR {req.requested_package.price.toLocaleString()})</Text>
                    )}
                  </Text>
                  
                  {req.amount && (
                    <Text size="sm">
                      <Text span color="dimmed">Amount: </Text>
                      PKR {req.amount.toLocaleString()}
                    </Text>
                  )}
                  
                  {req.remarks && (
                    <Card mt="xs" p="xs" bg="gray.0">
                      <Text size="xs">
                        <Text span weight={500}>Remarks: </Text>
                        {req.remarks}
                      </Text>
                    </Card>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        ) : (
          <Text color="dimmed">No history found for this user.</Text>
        )}
      </Modal>
    </div>
  );
}