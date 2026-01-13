// Profile.tsx - Complete Version with Only Package Activation Earnings
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { showNotification } from "@mantine/notifications";
import axiosConfig from "../configs/axios";
import { ACCOUNTS, FINANCIALS } from "../utils/API_CONSTANT";
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
  Tabs,
  Table,
  ActionIcon,
  Tooltip,
  Progress,
  useMantineTheme,
  Stepper,
  createStyles,
  ScrollArea
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { 
  Upload as IconUpload,
  Photo as IconPhoto,
  X as IconX,
  Check as IconCheck,
  Clock as IconClock,
  Package as IconPackage,
  History as IconHistory,
  CurrencyRupee as IconCurrencyRupee,
  Edit as IconEdit,
  Trash as IconTrash,
  AlertCircle as IconAlertCircle,
  Copy as IconCopy,
  ExternalLink as IconExternalLink,
  CreditCard as IconCreditCard,
  UserCheck as IconUserCheck,
  Trophy as IconTrophy,
  Star as IconStar,
  Crown as IconCrown,
  Receipt as IconReceipt,
  Lock as IconLock,
  LockOpen as IconLockOpen,
  Moneybag as IconMoneybag,
  Wallet as IconWallet,
  Cash as IconCash,
  Users as IconUsers,
  UserPlus as IconUserPlus,
  TrendingUp as IconTrendingUp,
  Refresh as IconRefresh,
  Filter as IconFilter
} from "tabler-icons-react";
import { CopyButton } from "@mantine/core";
import { IconArrowRight, IconInfoCircle } from "@tabler/icons";
import { format } from "fecha";
import axios, { AxiosResponse } from "axios";
import { Link as IconLink } from 'tabler-icons-react';

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    width: "100%",
  },
  statCard: {
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.md,
    }
  },
  referralBadge: {
    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 700,
  },
  earningsCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  tableRow: {
    '&:hover': {
      backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
    }
  },
  levelIndicator: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  level1: {
    backgroundColor: '#f59f00', // Orange
  },
  level2: {
    backgroundColor: '#228be6', // Blue
  },
  level3: {
    backgroundColor: '#40c057', // Green
  }
}));

export function Profile() {
  const theme = useMantineTheme();
  const { classes } = useStyles();
  
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState<string>("profile");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(user?.imageURL || null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [paymentPreview, setPaymentPreview] = useState<string | null>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [historyModalOpened, setHistoryModalOpened] = useState(false);
  const [paymentModalOpened, setPaymentModalOpened] = useState(false);
  const [currentPackageActivationModal, setCurrentPackageActivationModal] = useState(false);
  const [withdrawalModalOpened, setWithdrawalModalOpened] = useState(false);
  const [companyBank, setCompanyBank] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [requestAmount, setRequestAmount] = useState(0);
  const [account, setAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({});
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [rejectedAmount, setRejectedAmount] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [walletSettings, setWalletSettings] = useState<any>({ minAmount: 10 });
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
  const [activeWithdrawalTab, setActiveWithdrawalTab] = useState<string>("All");
  const [acceptModal, setAcceptModal] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [acceptRequest, setAcceptRequest]: any = useState({});
  
  // Referral history states - ONLY PACKAGE ACTIVATION EARNINGS
  const [referralHistory, setReferralHistory] = useState<any>(null);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalPackageEarnings: 0, // Only package activation earnings
    level1: { count: 0, packageEarnings: 0 },
    level2: { count: 0, packageEarnings: 0 },
    level3: { count: 0, packageEarnings: 0 }
  });




  
  const queryClient = useQueryClient();

  // Check if first time package setup
  useEffect(() => {
    if (user?.role === "Referrer" && !user?.referral_package) {
      setIsFirstTimeSetup(true);
      setActiveTab("package");
    }
  }, [user]);

  // Fetch user details
  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ["user", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await axiosConfig.get(`/users/${user._id}`);
      return res.data;
    },
    enabled: !!user?._id,
    onSuccess: (data) => {
      if (data) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    }
  });

  // Fetch referral history with ONLY PACKAGE ACTIVATION EARNINGS
  const fetchReferralHistory = async () => {
    if (!user?.user_code) return null;
    setIsLoadingReferrals(true);
    try {
      const res = await axiosConfig.get(`/dashboard/ref_count/${user.user_code}`);
      const data = res.data;
      
      if (data?.data) {
        setReferralHistory(data.data);
        
        // Calculate referral stats - ONLY PACKAGE ACTIVATION
        const stats = {
          totalReferrals: 0,
          totalPackageEarnings: 0,
          level1: { count: 0, packageEarnings: 0 },
          level2: { count: 0, packageEarnings: 0 },
          level3: { count: 0, packageEarnings: 0 }
        };

        // Calculate level 1 stats - ONLY ACTIVATION COMMISSION
        if (data.data.users?.level1) {
          stats.level1.count = data.data.users.level1.userReferrer || 0;
          stats.level1.packageEarnings = data.data.users.level1.activationCommission || 0;
          stats.totalReferrals += stats.level1.count;
          stats.totalPackageEarnings += stats.level1.packageEarnings;
        }

        // Calculate level 2 stats - ONLY ACTIVATION COMMISSION
        if (data.data.users?.level2) {
          stats.level2.count = data.data.users.level2.userReferrer || 0;
          stats.level2.packageEarnings = data.data.users.level2.activationCommission || 0;
          stats.totalReferrals += stats.level2.count;
          stats.totalPackageEarnings += stats.level2.packageEarnings;
        }

        // Calculate level 3 stats - ONLY ACTIVATION COMMISSION
        if (data.data.users?.level3) {
          stats.level3.count = data.data.users.level3.userReferrer || 0;
          stats.level3.packageEarnings = data.data.users.level3.activationCommission || 0;
          stats.totalReferrals += stats.level3.count;
          stats.totalPackageEarnings += stats.level3.packageEarnings;
        }

        setReferralStats(stats);
      }
      return data;
    } catch (error) {
      console.error("Error fetching referral history:", error);
      return null;
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Use query for referral history with auto-refresh
  const { 
    data: referralData, 
    refetch: refetchReferralHistory 
  } = useQuery({
    queryKey: ["referral-history", user?.user_code],
    queryFn: fetchReferralHistory,
    enabled: !!user?.user_code && user?.role === "Referrer",
    // refetchInterval: 1000000, // Refresh every 30 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch package upgrade requests
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

  // Fetch activation requests
  const { 
    data: activationRequests, 
    isLoading: activationLoading,
    refetch: refetchActivationRequests 
  } = useQuery({
    queryKey: ["user-activation-requests", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await axiosConfig.get(`/package-activations/user/${user._id}`);
      return res.data;
    },
    enabled: !!user?._id,
  });

  // Fetch upgrade history
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
    enabled: false,
  });

  // Fetch all packages
  const { isLoading: packagesLoading } = useQuery({
    queryKey: "referral-packages",
    queryFn: async () => {
      const res = await axiosConfig.get("/packages?page=1&limit=100");
      return res.data?.data?.docs || res.data?.data || [];
    },
    onSuccess: (data) => {
      const sorted = data.sort((a: any, b: any) => a.price - b.price);
      setPackages(sorted);
    },
    onError: () => {
      showNotification({
        title: "Error",
        message: "Failed to load packages",
        color: "red",
      });
    }
  });

  // Fetch company bank info
  const { isLoading: bankLoading } = useQuery({
    queryKey: "company-bank",
    queryFn: async () => {
      const res = await axiosConfig.get("/bank-details");
      return res.data?.data;
    },
    onSuccess: (data) => {
      setCompanyBank(data);
    }
  });

  // Fetch wallet settings
  const { isLoading: walletSettingsLoading } = useQuery({
    queryKey: ["wallet-settings"],
    queryFn: async () => {
      const res = await axiosConfig.get("/wallets");
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.data?.[0]) {
        setWalletSettings(data.data[0]);
      }
    }
  });

  // Fetch user bank accounts
  const fetchUserBankAccounts = async () => {
    if (!user?._id) return [];
    const res = await axiosConfig.get(`${ACCOUNTS}/user/${user?._id}?&limit=100`);
    return res.data?.data?.docs || [];
  };

  const { 
    data: userAccounts, 
    refetch: refetchAccounts 
  } = useQuery({
    queryKey: ["user-bank-accounts", user?._id],
    queryFn: fetchUserBankAccounts,
    enabled: !!user?._id,
    onSuccess: (data) => {
      const acc = data.map((account: any) => ({
        ...account,
        value: account._id,
        label: `${account.title} - ${account.bankName} (${account.account_number})`,
      }));
      setAccounts(acc);
    }
  });

  // Fetch wallet data - Include Financials data
  const fetchWalletData = async () => {
    if (!user?._id) return {};
    const params = new URLSearchParams({
      darsi: user.role === "Admin" ? "true" : "false",
    });

    const res = await axiosConfig.get(
      `/financials/get-revenue-total/${user._id}?${params}`
    );
    return res.data?.data || {};
  };

  const { 
    data: walletData, 
    refetch: refetchWallet 
  } = useQuery({
    queryKey: ["wallet-data", user?._id],
    queryFn: fetchWalletData,
    enabled: !!user?._id,
    onSuccess: (data) => {
      setRevenue(data);
    }
  });

  // Fetch withdrawal requests
  const fetchWithdrawalRequests = async () => {
    if (!user?._id) return [];
    const res = await axiosConfig.get(
      `/financials/requests/?user=${user._id}&page=1&limit=100`
    );
    return res.data?.data?.docs || [];
  };

  const { 
    data: withdrawalRequestsData, 
    refetch: refetchWithdrawalRequests 
  } = useQuery({
    queryKey: ["withdrawal-requests", user?._id],
    queryFn: fetchWithdrawalRequests,
    enabled: !!user?._id,
    onSuccess: (data) => {
      setWithdrawalRequests(data);
      
      // Calculate totals by status
      const pendingTotal = data
        .filter((r: any) => r.status === "Pending")
        .reduce((sum: number, r: any) => sum + (r.amountRequested || 0), 0);
      setPendingAmount(pendingTotal);
      
      const rejectedTotal = data
        .filter((r: any) => r.status === "Rejected")
        .reduce((sum: number, r: any) => sum + (r.amountRequested || 0), 0);
      setRejectedAmount(rejectedTotal);
      
      const approvedTotal = data
        .filter((r: any) => r.status === "Accepted")
        .reduce((sum: number, r: any) => sum + (r.amountRequested || 0), 0);
      setApprovedAmount(approvedTotal);
    }
  });

  // Check for any pending requests
  const hasPendingActivationRequest = activationRequests?.data?.some(
    (req: any) => req.status === "pending"
  );
  const hasPendingUpgradeRequest = userRequests?.data?.some(
    (req: any) => req.status === "pending"
  );
  const hasAnyPendingRequest = hasPendingActivationRequest || hasPendingUpgradeRequest;

  // Get current package activation status
  const isPackageActive = user?.referral_payment_status === true;
  const hasPackageAssigned = !!user?.referral_package;
  const needsActivation = hasPackageAssigned && !isPackageActive;

  // Check if can submit activation/upgrade requests
  const canActivateCurrentPackage = needsActivation && !hasPendingActivationRequest;
  const canSubmitUpgradeRequest = isPackageActive && !hasPendingUpgradeRequest;

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
      if (value === "earnings") {
        loadEarningsData();
      } else if (value === "referrals") {
        refetchReferralHistory();
      }
    }
  };

  // Load earnings data
  const loadEarningsData = async () => {
    setIsLoadingEarnings(true);
    await Promise.all([
      refetchWallet(),
      refetchWithdrawalRequests(),
      refetchAccounts()
    ]);
    setIsLoadingEarnings(false);
  };

  // Find current package
  const currentPackage = packages.find(p => p._id === user?.referral_package);
  
  // Calculate various amounts - Using Financials data
  const totalEarnings = revenue?.walletAmount || 0;
  const withdrawnAmount = revenue?.withdraw || 0;
  const totalreferalamount = revenue?.referralIncome || 0;
  const availableBalance = totalEarnings - pendingAmount;
  const netWallet = availableBalance - (walletSettings.minAmount || 10);
  const canWithdraw = netWallet > 0;

  // Current package activation form
  const currentPackageActivationForm = useForm({
    initialValues: {
      transaction_id: "",
      amount: currentPackage?.price || 0,
    },
    validate: {
      transaction_id: (value) => !value.trim() ? "Transaction ID is required" : null,
    },
  });

  // First time package selection form
  const firstTimeForm = useForm({
    initialValues: {
      selected_package: "",
      transaction_id: "",
      amount: 0,
    },
    validate: {
      selected_package: (value) => !value ? "Please select a package" : null,
      transaction_id: (value) => !value.trim() ? "Transaction ID is required" : null,
      amount: (value) => value <= 0 ? "Amount must be greater than 0" : null,
    },
  });

  // Upgrade form
  const upgradeForm = useForm({
    initialValues: {
      requested_package: "",
      transaction_id: "",
      amount: 0,
    },
    validate: {
      requested_package: (value) => !value ? "Please select a package" : null,
      transaction_id: (value) => !value.trim() ? "Transaction ID is required" : null,
      amount: (value) => value <= 0 ? "Amount must be greater than 0" : null,
    },
  });

  // Withdrawal form
  const withdrawalForm = useForm({
    initialValues: {
      amount: 0,
      accountId: "",
      notes: ""
    },
    validate: {
      amount: (value) => value <= 0 ? "Amount must be greater than 0" : null,
      accountId: (value) => !value ? "Please select a bank account" : null,
    },
  });

  // Profile form
  const profileForm = useForm({
    initialValues: {
      firstname: user?.firstname || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
    },
    validate: {
      firstname: (value) => !value.trim() ? "First name is required" : null,
      lastname: (value) => !value.trim() ? "Last name is required" : null,
      email: (value) => !/^\S+@\S+$/.test(value) ? "Invalid email" : null,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: any) => {
      const formData = new FormData();
      formData.append("firstname", values.firstname);
      formData.append("lastname", values.lastname);
      formData.append("email", values.email);
      formData.append("phone", values.phone || "");
      if (profileFile) {
        formData.append("file", profileFile);
      }

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
      
      const updatedUser = { 
        ...user, 
        ...data.data,
        imageURL: data.data?.imageURL || user.imageURL
      };
      setUser(updatedUser);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      refetchUser();
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to update profile",
        color: "red",
      });
    }
  });

  // Current package activation mutation
  const activateCurrentPackageMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!paymentFile) {
        throw new Error("Payment screenshot is required");
      }

      const formData = new FormData();
      formData.append("user_id", user._id);
      formData.append("transaction_id", values.transaction_id);
      formData.append("amount", values.amount.toString());
      formData.append("paymentScreenshot", paymentFile);
      formData.append("package_id", user.referral_package);

      const res = await axiosConfig.post("/package-activations/current", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: "Package activation request submitted!",
        color: "green",
      });
      
      setCurrentPackageActivationModal(false);
      currentPackageActivationForm.reset();
      setPaymentFile(null);
      setPaymentPreview(null);
      setActiveStep(0);
      refetchUser();
      refetchRequests();
      refetchActivationRequests();
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to activate package",
        color: "red",
      });
    },
  });

  // First package activation mutation
  const activatePackageMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!paymentFile) {
        throw new Error("Payment screenshot is required");
      }

      const formData = new FormData();
      formData.append("package_id", values.selected_package);
      formData.append("transaction_id", values.transaction_id);
      formData.append("amount", values.amount.toString());
      formData.append("paymentScreenshot", paymentFile);

      const res = await axiosConfig.post("/package-activations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: "Package activation request submitted!",
        color: "green",
      });
      
      setIsFirstTimeSetup(false);
      firstTimeForm.reset();
      setPaymentFile(null);
      setPaymentPreview(null);
      refetchUser();
      refetchActivationRequests();
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to activate package",
        color: "red",
      });
    },
  });

  // Package upgrade mutation
  const upgradePackageMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!paymentFile) {
        throw new Error("Payment screenshot is required");
      }

      const formData = new FormData();
      formData.append("user", user._id);
      formData.append("current_package", user.referral_package);
      formData.append("requested_package", values.requested_package);
      formData.append("transaction_id", values.transaction_id);
      formData.append("amount", values.amount.toString());
      formData.append("paymentScreenshot", paymentFile);

      const res = await axiosConfig.post("/package-upgrades", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: "Upgrade request submitted!",
        color: "green",
      });
      
      upgradeForm.reset();
      setPaymentFile(null);
      setPaymentPreview(null);
      refetchRequests();
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to submit upgrade request",
        color: "red",
      });
    },
  });

  // Withdrawal request mutation
  const withdrawalMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await axiosConfig.post("/financials/make-payment-request", {
        user: user._id,
        darsi: user.role === "Admin" ? true : false,
        amount: values.amount,
        accountId: values.accountId,
        notes: values.notes
      });
      return res.data;
    },
    onSuccess: (data) => {
      showNotification({
        title: "Success",
        message: data.message || "Withdrawal request submitted!",
        color: "green",
      });
      
      setWithdrawalModalOpened(false);
      withdrawalForm.reset();
      refetchWallet();
      refetchWithdrawalRequests();
    },
    onError: (error: any) => {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to submit withdrawal request",
        color: "red",
      });
    },
  });

  // Handle withdrawal request approval
  const handleAcceptRequest = async (data: any) => {
    try {
      const res = await axiosConfig.get(
        `/financials/accept-payment-request/${data._id}?amount=${data.amountAccepted}`
      );
      if (res?.status === 200) {
        await refetchWithdrawalRequests();
        await refetchWallet();
        setAcceptModal(false);
        setAcceptRequest({});
        showNotification({
          title: "Success",
          message: res.data.message,
          icon: <IconCheck />,
          color: "teal",
        });
      } else {
        showNotification({
          title: "Failed",
          message: res.data.message,
          icon: <IconCheck />,
          color: "red",
        });
      }
    } catch (error: any) {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to accept request",
        color: "red",
      });
    }
  };

  // Handle withdrawal request rejection
  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await axiosConfig.get(`/financials/reject-payment-request/${requestId}`);
      if (res?.status === 200) {
        await refetchWithdrawalRequests();
        await refetchWallet();
        showNotification({
          title: "Success",
          message: "Request rejected successfully",
          color: "green",
        });
      }
    } catch (error: any) {
      showNotification({
        title: "Error",
        message: error.response?.data?.error || "Failed to reject request",
        color: "red",
      });
    }
  };

  // Package selection handlers
  const handleFirstTimePackageSelect = (packageId: string) => {
    if (hasAnyPendingRequest) return;
    
    const selected = packages.find(p => p._id === packageId);
    if (selected) {
      setSelectedPackage(selected);
      firstTimeForm.setFieldValue("selected_package", packageId);
      firstTimeForm.setFieldValue("amount", selected.price);
    }
  };

  const handleUpgradePackageSelect = (packageId: string) => {
    if (hasAnyPendingRequest) return;
    
    const selected = packages.find(p => p._id === packageId);
    if (selected) {
      setSelectedPackage(selected);
      upgradeForm.setFieldValue("requested_package", packageId);
      upgradeForm.setFieldValue("amount", selected.price);
    }
  };

  // File preview handlers
  useEffect(() => {
    if (!paymentFile) {
      setPaymentPreview(null);
      return;
    }
    const url = URL.createObjectURL(paymentFile);
    setPaymentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [paymentFile]);

  useEffect(() => {
    if (!profileFile) {
      setProfilePreview(user?.imageURL || null);
      return;
    }
    const url = URL.createObjectURL(profileFile);
    setProfilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [profileFile, user?.imageURL]);

  // View history handler
  const handleViewHistory = () => {
    setHistoryModalOpened(true);
    fetchHistory();
  };

  // View payment details handler
  const handleViewPaymentDetails = () => {
    setPaymentModalOpened(true);
  };

  // Handle current package activation
  const handleActivateCurrentPackage = () => {
    if (!currentPackage) {
      showNotification({
        title: "Error",
        message: "No package assigned",
        color: "red",
      });
      return;
    }
    
    if (hasPendingActivationRequest) {
      showNotification({
        title: "Request Pending",
        message: "You already have a pending activation request. Please wait for admin approval.",
        color: "yellow",
      });
      return;
    }
    
    setCurrentPackageActivationModal(true);
    currentPackageActivationForm.setFieldValue("amount", currentPackage.price);
  };

  // Handle withdrawal request
  const handleWithdrawalRequest = () => {
    if (!canWithdraw) {
      showNotification({
        title: "Insufficient Balance",
        message: `You need to maintain a minimum balance of ${walletSettings.minAmount || 10} PKR`,
        color: "red",
      });
      return;
    }
    
    if (accounts.length === 0) {
      showNotification({
        title: "Bank Account Required",
        message: "Please add a bank account first",
        color: "red",
      });
      return;
    }
    
    withdrawalForm.setFieldValue("amount", netWallet);
    setWithdrawalModalOpened(true);
  };

  // Filter withdrawal requests
  const filteredWithdrawalRequests = withdrawalRequests.filter((request: any) => {
    if (activeWithdrawalTab === "All") return true;
    return request.status === activeWithdrawalTab;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return `PKR ${amount?.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render referral level indicator
  const renderLevelIndicator = (level: number) => {
    const levelClass = level === 1 ? classes.level1 : level === 2 ? classes.level2 : classes.level3;
    return (
      <div className={`${classes.levelIndicator} ${levelClass}`}>
        {level}
      </div>
    );
  };

  if (!user?._id) {
    return (
      <Center style={{ height: "60vh" }}>
        <Loader />
      </Center>
    );
  }

  return (
    <Box p="md">
      {/* Pending request alerts */}
      {hasAnyPendingRequest && (
        <Alert 
          color="yellow" 
          mb="md" 
          icon={<IconClock size={20} />}
          title="Request Pending Approval"
          variant="filled"
        >
          <Group position="apart">
            <Text size="sm" color="white">
              You have a pending {hasPendingActivationRequest ? 'activation' : 'upgrade'} request. 
              Please wait for admin approval before submitting another request.
            </Text>
            <Badge color="yellow" size="lg">
              PENDING
            </Badge>
          </Group>
        </Alert>
      )}

      {/* Package activation required alert */}
      {needsActivation && !isFirstTimeSetup && !hasPendingActivationRequest && (
        <Alert 
          color="orange" 
          mb="md" 
          icon={<IconLock size={20} />}
          title="Package Activation Required"
          variant="filled"
        >
          <Group position="apart">
            <Text size="sm" color="white">
              Your package <strong>{currentPackage?.title}</strong> needs to be activated. 
              Please complete the payment to start earning commissions.
            </Text>
            <Button 
              size="sm" 
              color="white" 
              variant="white"
              onClick={handleActivateCurrentPackage}
              leftIcon={<IconReceipt size={16} />}
            >
              Activate Now
            </Button>
          </Group>
        </Alert>
      )}

      {/* First time setup alert */}
      {isFirstTimeSetup && !hasPendingActivationRequest && (
        <Alert 
          color="blue" 
          mb="md" 
          icon={<IconAlertCircle size={20} />}
          title="Welcome! Activate Your First Package"
          variant="filled"
        >
          <Text size="sm" color="white">
            As a referrer, you need to activate a package to start earning commissions. 
            Please select a package and make the payment.
          </Text>
        </Alert>
      )}

      <Paper shadow="lg" radius="md" p="xl">
        <Tabs value={activeTab} onTabChange={handleTabChange}>
          <Tabs.List grow>
            <Tabs.Tab value="profile" icon={<IconUserCheck size={14} />}>Profile</Tabs.Tab>
            <Tabs.Tab value="package" icon={<IconPackage size={14} />}>
              {isFirstTimeSetup ? "Activate Package" : "My Package"}
            </Tabs.Tab>
            <Tabs.Tab value="referrals" icon={<IconUsers size={14} />}>Referrals</Tabs.Tab>
            <Tabs.Tab value="earnings" icon={<IconMoneybag size={14} />}>Earnings</Tabs.Tab>
            <Tabs.Tab value="history" icon={<IconHistory size={14} />}>History</Tabs.Tab>
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Panel value="profile" pt="xl">
            <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} spacing="xl">
              <Card withBorder shadow="sm">
                <Title order={3} mb="md">Personal Information</Title>
                
                <form onSubmit={profileForm.onSubmit((values) => updateProfileMutation.mutate(values))}>
                  <Stack spacing="md">
                    <Group position="center">
                      <Avatar
                        src={profilePreview || undefined}
                        size={120}
                        radius="xl"
                        color="blue"
                      />
                    </Group>

                    <TextInput
                      label="First Name"
                      placeholder="Enter first name"
                      {...profileForm.getInputProps("firstname")}
                      required
                      disabled
                    />
                    
                    <TextInput
                      label="Last Name"
                      placeholder="Enter last name"
                      {...profileForm.getInputProps("lastname")}
                      required
                      disabled
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

              <Card withBorder shadow="sm">
                <Title order={3} mb="md">Account Information</Title>
                
                <Stack spacing="md">
                  <div>
                    <Text size="sm" color="dimmed">User ID</Text>
                    <Group spacing="xs">
                      <Text weight={500}>{user._id}</Text>
                      <CopyButton value={user._id} timeout={2000}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? "Copied" : "Copy ID"}>
                            <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                              <IconCopy size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </Group>
                  </div>

                  <div>
                    <Text size="sm" color="dimmed">Registration Date</Text>
                    <Text weight={500}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </div>

                  <Divider />

                  <Title order={4}>Security</Title>
                  <Button 
                    variant="outline" 
                    color="red"
                    onClick={() => {
                      sessionStorage.clear();
                      window.location.href = "/login";
                    }}
                    leftIcon={<IconClock size={16} />}
                  >
                    Logout from all devices
                  </Button>
                </Stack>
              </Card>
            </SimpleGrid>
          </Tabs.Panel>

          {/* Package Tab */}
          <Tabs.Panel value="package" pt="xl">
            {isFirstTimeSetup ? (
              <Card withBorder shadow="sm">
                <Title order={3} mb="md" color="blue">Activate Your First Package</Title>
                <Text color="dimmed" mb="xl">
                  Choose a package that fits your goals. Higher packages offer better commission rates.
                </Text>

                <SimpleGrid cols={3} breakpoints={[{ maxWidth: 'md', cols: 1 }]} spacing="lg" mb="xl">
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg._id} 
                      withBorder 
                      p="lg" 
                      radius="md"
                      className={classes.statCard}
                      style={{ 
                        border: firstTimeForm.values.selected_package === pkg._id ? '2px solid #228be6' : undefined,
                        cursor: hasAnyPendingRequest ? 'not-allowed' : 'pointer',
                        opacity: hasAnyPendingRequest ? 0.6 : 1
                      }}
                      onClick={hasAnyPendingRequest ? undefined : () => handleFirstTimePackageSelect(pkg._id)}
                    >
                      <Group position="apart" mb="md">
                        <Badge color="blue" size="lg">{pkg.title}</Badge>
                        {pkg.isPopular && <Badge color="yellow">POPULAR</Badge>}
                      </Group>
                      
                      <Text size="xl" weight={700} mb="xs">
                        {formatCurrency(pkg.price)}
                      </Text>
                      
                      <Text size="sm" color="dimmed" mb="md">
                        Commission: {pkg.commission_rate}%
                      </Text>
                      
                      <Button
                        variant={firstTimeForm.values.selected_package === pkg._id ? "filled" : "outline"}
                        fullWidth
                        disabled={hasAnyPendingRequest}
                      >
                        {firstTimeForm.values.selected_package === pkg._id ? "Selected" : "Select"}
                      </Button>
                    </Card>
                  ))}
                </SimpleGrid>

                {selectedPackage && (
                  <Card withBorder bg="blue.0" mb="xl">
                    <Title order={4} mb="md">Selected Package: {selectedPackage.title}</Title>
                    <SimpleGrid cols={2}>
                      <div>
                        <Text size="sm" color="dimmed">Package Price</Text>
                        <Text size="xl" weight={700}>{formatCurrency(selectedPackage.price)}</Text>
                      </div>
                      <div>
                        <Text size="sm" color="dimmed">Commission Rate</Text>
                        <Text size="xl" weight={700}>{selectedPackage.commission_rate}%</Text>
                      </div>
                    </SimpleGrid>
                  </Card>
                )}

                <form onSubmit={firstTimeForm.onSubmit((values) => {
                  if (hasAnyPendingRequest) {
                    showNotification({
                      title: "Request Pending",
                      message: "Please wait for admin approval of your existing request",
                      color: "yellow",
                    });
                    return;
                  }
                  
                  if (!paymentFile) {
                    showNotification({
                      title: "Error",
                      message: "Please upload payment screenshot",
                      color: "red",
                    });
                    return;
                  }
                  activatePackageMutation.mutate(values);
                })}>
                  <Stack spacing="md">
                    <TextInput
                      label="Transaction ID"
                      placeholder="Enter your payment transaction ID"
                      {...firstTimeForm.getInputProps("transaction_id")}
                      required
                      disabled={hasAnyPendingRequest}
                    />

                    <NumberInput
                      label="Amount"
                      value={firstTimeForm.values.amount}
                      disabled
                      parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                      formatter={(value) =>
                        !Number.isNaN(parseFloat(value || ''))
                          ? `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                          : 'PKR '
                      }
                    />

                    <div>
                      <Text size="sm" weight={500} mb="xs">Payment Proof</Text>
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
                              <Text size="sm" color="dimmed">Screenshot uploaded</Text>
                            </Group>
                            <Button
                              size="xs"
                              color="red"
                              variant="light"
                              onClick={() => setPaymentFile(null)}
                              leftIcon={<IconX size={14} />}
                              disabled={hasAnyPendingRequest}
                            >
                              Remove
                            </Button>
                          </Group>
                        </Card>
                      ) : (
                        <FileButton
                          onChange={setPaymentFile}
                          accept="image/png,image/jpeg,image/webp"
                          disabled={hasAnyPendingRequest}
                        >
                          {(props) => (
                            <Button 
                              {...props} 
                              variant="light" 
                              leftIcon={<IconUpload size={16} />}
                              fullWidth
                              disabled={hasAnyPendingRequest}
                            >
                              Upload Payment Screenshot
                            </Button>
                          )}
                        </FileButton>
                      )}
                    </div>

                    <Button
                      type="submit"
                      loading={activatePackageMutation.isLoading}
                      disabled={!selectedPackage || !paymentFile || hasAnyPendingRequest}
                      leftIcon={<IconCheck size={16} />}
                      size="lg"
                      color="blue"
                      fullWidth
                    >
                      {hasAnyPendingRequest ? "Request Pending..." : "Submit Activation Request"}
                    </Button>

                    <Button
                      variant="light"
                      onClick={handleViewPaymentDetails}
                      leftIcon={<IconCreditCard size={16} />}
                    >
                      View Bank Details
                    </Button>
                  </Stack>
                </form>
              </Card>
            ) : (
              <SimpleGrid cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1 }]} spacing="xl">
                {/* Current Package Info */}
                <Card withBorder shadow="sm">
                  <Title order={3} mb="md">Current Package</Title>
                  
                  {currentPackage ? (
                    <>
                      <Card withBorder bg={isPackageActive ? "green.0" : "orange.0"} mb="md">
                        <Group position="apart" mb="md">
                          <Badge 
                            color={isPackageActive ? "green" : "orange"} 
                            size="xl" 
                            variant="filled"
                          >
                            {currentPackage.title}
                          </Badge>
                          <Badge 
                            color={isPackageActive ? "green" : "red"}
                            size="lg"
                          >
                            {isPackageActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </Group>
                        
                        <Text style={{ fontSize: 32 }} weight={900} mb="xs">
                          {formatCurrency(currentPackage.price)}
                        </Text>
                        
                        <Progress 
                          value={isPackageActive ? 100 : 0} 
                          size="lg" 
                          color={isPackageActive ? "green" : "orange"} 
                          label={isPackageActive ? "Active Package" : "Inactive Package"}
                          mb="md"
                        />
                        
                        {needsActivation && !hasPendingActivationRequest && (
                          <Button
                            color="orange"
                            variant="filled"
                            fullWidth
                            mt="md"
                            onClick={handleActivateCurrentPackage}
                            leftIcon={<IconReceipt size={16} />}
                          >
                            Activate Package
                          </Button>
                        )}
                      </Card>

                      {isPackageActive && (
                        <>
                          <Divider my="md" />
                          <Title order={4} mb="md">Package Benefits</Title>
                          <Stack spacing="xs">
                            <Group spacing="xs">
                              <IconCheck size={16} color="green" />
                              <Text>Commission rate: {currentPackage.commission}%</Text>
                            </Group>
                            <Group spacing="xs">
                              <IconCheck size={16} color="green" />
                              <Text>Discount rate: {currentPackage.discount_percentage}%</Text>
                            </Group>
                            <Group spacing="xs">
                              <IconCheck size={16} color="green" />
                              <Text>Direct Referral Profit 25%</Text>
                            </Group>
                            <Group spacing="xs">
                              <IconCheck size={16} color="green" />
                              <Text>2nd Line Profit 15%</Text>
                            </Group>
                            <Group spacing="xs">
                              <IconCheck size={16} color="green" />
                              <Text>3rd Line Profit 10%</Text>
                            </Group>
                          </Stack>
                        </>
                      )}
                    </>
                  ) : (
                    <Alert color="yellow" icon={<IconAlertCircle />}>
                      <Text>No package assigned. Please contact admin or select a package.</Text>
                    </Alert>
                  )}
                </Card>

                {/* Package Upgrade Form */}
                <Card withBorder shadow="sm">
                  <Title order={3} mb="md">Package Management</Title>
                  
                  {hasPendingUpgradeRequest ? (
                    <Alert color="yellow" icon={<IconClock />}>
                      <Text weight={600} mb="xs">Upgrade Request Pending</Text>
                      <Text size="sm" color="dimmed">
                        You have a pending upgrade request. Please wait for admin approval.
                      </Text>
                    </Alert>
                  ) : hasPendingActivationRequest ? (
                    <Alert color="yellow" icon={<IconClock />}>
                      <Text weight={600} mb="xs">Activation Request Pending</Text>
                      <Text size="sm" color="dimmed">
                        You have a pending activation request. Please wait for admin approval.
                      </Text>
                    </Alert>
                  ) : !isPackageActive ? (
                    <Alert color="orange" icon={<IconLock size={20} />}>
                      <Text weight={600} mb="xs">Package Not Active</Text>
                      <Text size="sm" color="dimmed">
                        Please activate your current package before requesting an upgrade.
                      </Text>
                    </Alert>
                  ) : (
                    <>
                      <Select
                        label="Select New Package for Upgrade"
                        placeholder="Choose a package to upgrade"
                        data={packages
                          .filter(p => p.price > (currentPackage?.price || 0))
                          .map(pkg => ({
                            value: pkg._id,
                            label: `${pkg.title} - ${formatCurrency(pkg.price)}`
                          }))}
                        value={upgradeForm.values.requested_package}
                        onChange={handleUpgradePackageSelect}
                        required
                        searchable
                        nothingFound="No higher packages available"
                        mb="md"
                        disabled={hasAnyPendingRequest}
                      />

                      {selectedPackage && upgradeForm.values.requested_package && (
                        <Card withBorder bg="green.0" mb="md">
                          <Title order={5} mb="xs">Upgrade Summary</Title>
                          <SimpleGrid cols={2}>
                            <div>
                              <Text size="sm" color="dimmed">Current Package</Text>
                              <Text weight={600}>{currentPackage?.title}</Text>
                            </div>
                            <div>
                              <Text size="sm" color="dimmed">New Package</Text>
                              <Text weight={600}>{selectedPackage.title}</Text>
                            </div>
                            <div>
                              <Text size="sm" color="dimmed">Upgrade Cost</Text>
                              <Text style={{ fontSize: 24 }} weight={700} color="green">
                                {formatCurrency(selectedPackage.price)}
                              </Text>
                            </div>
                          </SimpleGrid>
                        </Card>
                      )}

                      <form onSubmit={upgradeForm.onSubmit((values) => {
                        if (hasAnyPendingRequest) {
                          showNotification({
                            title: "Request Pending",
                            message: "Please wait for admin approval of your existing request",
                            color: "yellow",
                          });
                          return;
                        }
                        
                        if (!paymentFile) {
                          showNotification({
                            title: "Error",
                            message: "Please upload payment screenshot",
                            color: "red",
                          });
                          return;
                        }
                        upgradePackageMutation.mutate(values);
                      })}>
                        <Stack spacing="md">
                          <TextInput
                            label="Transaction ID"
                            placeholder="Enter upgrade payment transaction ID"
                            {...upgradeForm.getInputProps("transaction_id")}
                            required
                            disabled={!upgradeForm.values.requested_package || hasAnyPendingRequest}
                          />

                          <NumberInput
                            label="Upgrade Amount"
                            value={upgradeForm.values.amount}
                            disabled
                            parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                            formatter={(value) =>
                              !Number.isNaN(parseFloat(value || ''))
                                ? `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                : 'PKR '
                            }
                          />

                          <div>
                            <Text size="sm" weight={500} mb="xs">Payment Proof</Text>
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
                                    <Text size="sm" color="dimmed">Screenshot uploaded</Text>
                                  </Group>
                                  <Button
                                    size="xs"
                                    color="red"
                                    variant="light"
                                    onClick={() => setPaymentFile(null)}
                                    leftIcon={<IconX size={14} />}
                                    disabled={hasAnyPendingRequest}
                                  >
                                    Remove
                                  </Button>
                                </Group>
                              </Card>
                            ) : (
                              <FileButton
                                onChange={setPaymentFile}
                                accept="image/png,image/jpeg,image/webp"
                                disabled={!upgradeForm.values.requested_package || hasAnyPendingRequest}
                              >
                                {(props) => (
                                  <Button 
                                    {...props} 
                                    variant="light" 
                                    leftIcon={<IconUpload size={16} />}
                                    fullWidth
                                    disabled={!upgradeForm.values.requested_package || hasAnyPendingRequest}
                                  >
                                    Upload Payment Screenshot
                                  </Button>
                                )}
                              </FileButton>
                            )}
                          </div>

                          <Button
                            type="submit"
                            loading={upgradePackageMutation.isLoading}
                            disabled={!upgradeForm.values.requested_package || !paymentFile || hasAnyPendingRequest}
                            leftIcon={<IconCheck size={16} />}
                            size="lg"
                            color="green"
                            fullWidth
                          >
                            {hasAnyPendingRequest ? "Request Pending..." : "Submit Upgrade Request"}
                          </Button>

                          <Button
                            variant="light"
                            onClick={handleViewPaymentDetails}
                            leftIcon={<IconCreditCard size={16} />}
                          >
                            View Bank Details
                          </Button>
                        </Stack>
                      </form>
                    </>
                  )}
                </Card>
              </SimpleGrid>
            )}
          </Tabs.Panel>

          {/* Referrals Tab - ONLY PACKAGE ACTIVATION EARNINGS */}
          <Tabs.Panel value="referrals" pt="xl">
            {user.role === "Referrer" ? (
              <Stack spacing="xl">
                {/* Referral Stats Summary - ONLY PACKAGE EARNINGS */}
                <SimpleGrid cols={4} breakpoints={[
                  { maxWidth: 'lg', cols: 2 },
                  { maxWidth: 'sm', cols: 1 }
                ]} spacing="lg">
                  <Card withBorder shadow="sm" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Total Referrals</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {referralStats.totalReferrals}
                        </Text>
                      </div>
                      <IconUsers size={32} color="blue" />
                    </Group>
                    <Progress 
                      value={referralStats.totalReferrals > 0 ? 100 : 0} 
                      size="md" 
                      color="blue" 
                      mt="sm" 
                    />
                  </Card>

                  <Card withBorder shadow="sm" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Package Earnings</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(totalreferalamount)}
                        </Text>
                      </div>
                      <IconMoneybag size={32} color="green" />
                    </Group>
                    <Progress 
                      value={referralStats.totalPackageEarnings > 0 ? 100 : 0} 
                      size="md" 
                      color="green" 
                      mt="sm" 
                    />
                  </Card>

                  {/* <Card withBorder shadow="sm" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Level 1 Earnings</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(referralStats.level1.packageEarnings)}
                        </Text>
                        <Text size="sm" color="dimmed">
                          {referralStats.level1.count} users
                        </Text>
                      </div>
                      <IconUserPlus size={32} color="orange" />
                    </Group>
                    <Progress 
                      value={referralStats.level1.count > 0 ? 100 : 0} 
                      size="md" 
                      color="orange" 
                      mt="sm" 
                    />
                  </Card> */}

                  {/* <Card withBorder shadow="sm" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Level 2 & 3 Earnings</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(referralStats.level2.packageEarnings + referralStats.level3.packageEarnings)}
                        </Text>
                        <Text size="sm" color="dimmed">
                          {referralStats.level2.count + referralStats.level3.count} users
                        </Text>
                      </div>
                      <IconTrendingUp size={32} color="violet" />
                    </Group>
                    <Progress 
                      value={(referralStats.level2.count + referralStats.level3.count) > 0 ? 100 : 0} 
                      size="md" 
                      color="violet" 
                      mt="sm" 
                    />
                  </Card> */}
                </SimpleGrid>

                {/* Package Earnings Breakdown */}
                <Card withBorder shadow="sm">
                  <Group position="apart" mb="md">
                    <Title order={3}>Package Activation Earnings</Title>
                    <Button 
                      variant="light" 
                      size="sm" 
                      leftIcon={<IconRefresh size={14} />}
                      onClick={() => refetchReferralHistory()}
                      loading={isLoadingReferrals}
                    >
                      Refresh
                    </Button>
                  </Group>
                  
                  <SimpleGrid cols={3} spacing="lg">
                    <Card withBorder p="md" className={classes.earningsCard}>
                      <div className={`${classes.levelIndicator} ${classes.level1}`}>1</div>
                      <Text weight={700} mt="md" color="white">Direct Referrals</Text>
                      <Text size="sm" color="white" opacity={0.9}>25% Commission</Text>
                      <Text size="xl" weight={900} color="white" mt="md">
                       Total {referralStats.level1.count}
                      </Text>
                     
                    </Card>

                    <Card withBorder p="md" className={classes.earningsCard}>
                      <div className={`${classes.levelIndicator} ${classes.level2}`}>2</div>
                      <Text weight={700} mt="md" color="white">Second Level</Text>
                      <Text size="sm" color="white" opacity={0.9}>15% Commission</Text>
                      <Text size="xl" weight={900} color="white" mt="md">
                        Total {referralStats.level2.count}
                      </Text>
                     
                    </Card>

                    <Card withBorder p="md" className={classes.earningsCard}>
                      <div className={`${classes.levelIndicator} ${classes.level3}`}>3</div>
                      <Text weight={700} mt="md" color="white">Third Level</Text>
                      <Text size="sm" color="white" opacity={0.9}>10% Commission</Text>
                      <Text size="xl" weight={900} color="white" mt="md">
                       Total {referralStats.level3.count}
                      </Text>
                     
                    </Card>
                  </SimpleGrid>
                </Card>

                {/* Referral Users Table - ONLY PACKAGE EARNINGS */}
                <Card withBorder shadow="sm">
                  <Title order={3} mb="md">Referral Details</Title>
                  
                  {isLoadingReferrals ? (
                    <Center py="xl">
                      <Loader />
                    </Center>
                  ) : referralHistory?.users ? (
                    <Tabs defaultValue="level1">
                      <Tabs.List>
                        <Tabs.Tab value="level1" icon={<div className={`${classes.levelIndicator} ${classes.level1}`}>1</div>}>
                          Direct Referrals ({referralHistory.users.level1?.userReferrer || 0})
                        </Tabs.Tab>
                        <Tabs.Tab value="level2" icon={<div className={`${classes.levelIndicator} ${classes.level2}`}>2</div>}>
                          Level 2 ({referralHistory.users.level2?.userReferrer || 0})
                        </Tabs.Tab>
                        <Tabs.Tab value="level3" icon={<div className={`${classes.levelIndicator} ${classes.level3}`}>3</div>}>
                          Level 3 ({referralHistory.users.level3?.userReferrer || 0})
                        </Tabs.Tab>
                      </Tabs.List>

                      {["level1", "level2", "level3"].map((level) => (
                        <Tabs.Panel key={level} value={level} pt="md">
                          {referralHistory.users[level]?.users?.length > 0 ? (
                            <ScrollArea style={{ height: 400 }}>
                              <Table>
                                <thead>
                                  <tr>
                                    <th>User</th>
                                    {/* <th>Email</th> */}
                                    <th>User Code</th>
                                    <th>Joined Date</th>
                                    {/* <th>Package Earnings</th> */}
                                  </tr>
                                </thead>
                                <tbody>
                                  {referralHistory.users[level].users.map((user: any, index: number) => (
                                    <tr key={user._id} className={classes.tableRow}>
                                      <td>
                                        <Group spacing="sm">
                                          <Avatar size={30} radius={30}>
                                            {user.firstname?.[0]}{user.lastname?.[0]}
                                          </Avatar>
                                          <Text size="sm" weight={500}>
                                            {user.firstname} {user.lastname}
                                          </Text>
                                        </Group>
                                      </td>
                                      {/* <td>
                                        <Text size="sm">{user.email}</Text>
                                      </td> */}
                                      <td>
                                        <Badge variant="outline" color="blue">
                                          {user.user_code}
                                        </Badge>
                                      </td>
                                      <td>
                                        <Text size="sm">
                                          {format(new Date(user.createdAt), "DD-MMM-YY")}
                                        </Text>
                                      </td>
                                      {/* <td>
                                        <Badge 
                                          className={classes.referralBadge}
                                          size="lg"
                                        >
                                          {formatCurrency(user.commission || 0)}
                                        </Badge>
                                      </td> */}
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </ScrollArea>
                          ) : (
                            <Center py="xl">
                              <Text color="dimmed">No users found at this level</Text>
                            </Center>
                          )}
                          
                          {/* Level Summary - ONLY PACKAGE EARNINGS */}
                          <Card withBorder mt="md" bg="gray.0">
                            <Group position="apart">
                              <div>
                                <Text size="sm" color="dimmed">Total {level === 'level1' ? 'Direct' : level === 'level2' ? 'Level 2' : 'Level 3'} Package Earnings</Text>
                                <Text size="xl" weight={700}>
                                  {formatCurrency(referralHistory.users[level]?.commission || 0)}
                                </Text>
                              </div>
                              <div>
                                <Text size="sm" color="dimmed">Commission Rate</Text>
                                <Text size="lg" weight={600}>
                                  {level === 'level1' ? '25%' : level === 'level2' ? '15%' : '10%'}
                                </Text>
                              </div>
                            </Group>
                          </Card>
                        </Tabs.Panel>
                      ))}
                    </Tabs>
                  ) : (
                    <Center py="xl">
                      <Text color="dimmed">No referral data available</Text>
                    </Center>
                  )}
                </Card>

                {/* Your Referral Code */}
                <Card withBorder shadow="sm">
                  <Title order={3} mb="md">Your Referral Code</Title>
                  <Card withBorder p="lg" bg="blue.0">
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Share this code to earn from package activations</Text>
                        <Text size="xl" weight={900} style={{ fontFamily: 'monospace' }}>
                          {user.user_code}
                        </Text>
                      </div>
                      <Stack spacing="xs">
                        <CopyButton value={user.user_code}>
                          {({ copied, copy }) => (
                            <Button
                              color={copied ? "teal" : "blue"}
                              onClick={copy}
                              leftIcon={<IconCopy size={16} />}
                            >
                              {copied ? "Copied!" : "Copy Code"}
                            </Button>
                          )}
                        </CopyButton>
                        <Button
                          variant="light"
                          onClick={() => {
                            const referralLink = `${window.location.origin}/register?ref=${user.user_code}`;
                            navigator.clipboard.writeText(referralLink);
                            showNotification({
                              title: "Success",
                              message: "Referral link copied to clipboard!",
                              color: "green",
                            });
                          }}
                          leftIcon={<IconLink size={16} />}
                        >
                          Copy Referral Link
                        </Button>
                      </Stack>
                    </Group>
                  </Card>
                </Card>
              </Stack>
            ) : (
              <Center py="xl">
                <Alert color="blue" icon={<IconInfoCircle />}>
                  <Text>Referral features are only available for Referrer accounts.</Text>
                </Alert>
              </Center>
            )}
          </Tabs.Panel>

          {/* Earnings Tab - Financials Data */}
          <Tabs.Panel value="earnings" pt="xl">
            {isLoadingEarnings ? (
              <Center py="xl">
                <Loader size="lg" />
              </Center>
            ) : (
              <>
                {/* Top buttons */}
                <Box mb="md" style={{ display: "flex", justifyContent: "end" }}>
                  {user.role !== "Admin" && (
                    <Button
                      size="sm"
                      leftIcon={<IconMoneybag size={16} />}
                      onClick={handleWithdrawalRequest}
                      disabled={!revenue.walletAmount}
                    >
                      Make a request
                    </Button>
                  )}
                </Box>

                {/* Financials Overview */}
                <SimpleGrid cols={4} breakpoints={[
                  { maxWidth: 'lg', cols: 2 },
                  { maxWidth: 'sm', cols: 1 }
                ]} spacing="lg" mb="xl">
                  <Card withBorder shadow="sm" bg="green.0" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Total Earnings</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(totalEarnings + withdrawnAmount)}
                        </Text>
                      </div>
                      <IconWallet size={32} color="green" />
                    </Group>
                    <Progress value={100} size="md" color="green" mt="sm" />
                  </Card>

                  <Card withBorder shadow="sm" bg="blue.0" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Available Balance</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(availableBalance)}
                        </Text>
                      </div>
                      <IconCash size={32} color="blue" />
                    </Group>
                    <Progress 
                      value={availableBalance > 0 ? ((availableBalance / totalEarnings) * 100) || 0 : 0} 
                      size="md" 
                      color="blue" 
                      mt="sm" 
                    />
                  </Card>

                  <Card withBorder shadow="sm" bg="orange.0" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Pending Requests</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(pendingAmount)}
                        </Text>
                      </div>
                      <IconClock size={32} color="orange" />
                    </Group>
                    <Progress 
                      value={pendingAmount > 0 ? ((pendingAmount / totalEarnings) * 100) || 0 : 0} 
                      size="md" 
                      color="orange" 
                      mt="sm" 
                    />
                  </Card>

                  <Card withBorder shadow="sm" bg="red.0" className={classes.statCard}>
                    <Group position="apart">
                      <div>
                        <Text size="sm" color="dimmed">Withdrawn Amount</Text>
                        <Text style={{ fontSize: 28 }} weight={900}>
                          {formatCurrency(withdrawnAmount)}
                        </Text>
                      </div>
                      <IconMoneybag size={32} color="red" />
                    </Group>
                    <Progress 
                      value={withdrawnAmount > 0 ? ((withdrawnAmount / totalEarnings) * 100) || 0 : 0} 
                      size="md" 
                      color="red" 
                      mt="sm" 
                    />
                  </Card>
                </SimpleGrid>

                {/* Detailed Financial Info Box */}
                <Card withBorder shadow="sm" mb="md">
                  <Title order={4} mb="md">Financial Details</Title>
                  <SimpleGrid cols={4} spacing="md">
                    <div>
                      <Text size="sm" color="dimmed">Wallet Balance</Text>
                      <Text size="lg" weight={700}>{formatCurrency(revenue?.walletAmount || 0)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Total Withdrawn</Text>
                      <Text size="lg" weight={700}>{formatCurrency(withdrawnAmount)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Pending Requests</Text>
                      <Text size="lg" weight={700}>{formatCurrency(pendingAmount)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Rejected Amount</Text>
                      <Text size="lg" weight={700}>{formatCurrency(rejectedAmount)}</Text>
                    </div>
                  </SimpleGrid>
                  <Divider my="md" />
                  <SimpleGrid cols={3} spacing="md">
                    <div>
                      <Text size="sm" color="dimmed">Net Available</Text>
                      <Text size="lg" weight={700} color="green">
                        {formatCurrency(revenue?.walletAmount - pendingAmount)}
                      </Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Min. Balance to Keep</Text>
                      <Text size="lg" weight={700}>{formatCurrency(walletSettings.minAmount || 10)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Available for Withdrawal</Text>
                      <Text size="lg" weight={700} color="blue">
                        {formatCurrency(Math.max(netWallet, 0))}
                      </Text>
                    </div>
                  </SimpleGrid>
                </Card>

                {/* Withdrawal Requests Table */}
                <Card withBorder shadow="sm">
                  <Tabs
                    defaultValue="All"
                    onTabChange={(value) => setActiveWithdrawalTab(value || "All")}
                  >
                    <Tabs.List>
                      <Tabs.Tab value="All">All</Tabs.Tab>
                      <Tabs.Tab value="Pending">Pending</Tabs.Tab>
                      <Tabs.Tab value="Accepted">Accepted</Tabs.Tab>
                      <Tabs.Tab value="Rejected">Rejected</Tabs.Tab>
                    </Tabs.List>

                    {["All", "Pending", "Accepted", "Rejected"].map((tab) => (
                      <Tabs.Panel key={tab} value={tab} pt="xs">
                        <Table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Account</th>
                              <th>Amount Requested</th>
                              <th>Amount Accepted</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredWithdrawalRequests.length > 0 ? (
                              filteredWithdrawalRequests.map((request, index) => (
                                <tr key={request._id} className={classes.tableRow}>
                                  <td>{format(new Date(request.createdAt), "DD-MMM-YY")}</td>
                                  <td>{request.account?.[0]?.title || "N/A"}</td>
                                  <td>{formatCurrency(request.amountRequested)}</td>
                                  <td>{formatCurrency(request.amountAccepted)}</td>
                                  <td>
                                    <Badge color={
                                      request.status === 'Accepted' ? 'green' :
                                      request.status === 'Pending' ? 'yellow' : 'red'
                                    }>
                                      {request.status}
                                    </Badge>
                                  </td>
                                  <td>
                                    {user.role === "Admin" && request.status === "Pending" && (
                                      <Group spacing={4} noWrap>
                                        <ActionIcon
                                          color="green"
                                          component="button"
                                          onClick={() => {
                                            setAcceptModal(true);
                                            setAcceptRequest({...request, amountAccepted: request.amountRequested});
                                          }}
                                        >
                                          <IconCheck size={18} />
                                        </ActionIcon>
                                        <ActionIcon
                                          color="red"
                                          variant="light"
                                          component="button"
                                          onClick={() => handleRejectRequest(request._id)}
                                        >
                                          <IconTrash size={18} />
                                        </ActionIcon>
                                      </Group>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} align="center">
                                  <Text color="dimmed" py="xl">No {tab === "All" ? "" : tab.toLowerCase()} withdrawal requests found</Text>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                </Card>

                {/* Withdrawal Information */}
                <Card withBorder shadow="sm" mt="md" bg="gray.0">
                  <Title order={4} mb="md">Withdrawal Information</Title>
                  <SimpleGrid cols={2} spacing="md">
                    <div>
                      <Text size="sm" color="dimmed">Available for Withdrawal</Text>
                      <Text size="lg" weight={700}>{formatCurrency(Math.max(netWallet, 0))}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Minimum Balance to Keep</Text>
                      <Text size="lg" weight={700}>{formatCurrency(walletSettings.minAmount || 10)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Pending Requests</Text>
                      <Text size="lg" weight={700}>{formatCurrency(pendingAmount)}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">Rejected Amount</Text>
                      <Text size="lg" weight={700}>{formatCurrency(rejectedAmount)}</Text>
                    </div>
                  </SimpleGrid>
                  
                  {!canWithdraw && netWallet <= 0 && (
                    <Alert color="yellow" icon={<IconAlertCircle />} mt="md">
                      <Text size="sm">
                        You cannot withdraw because you need to maintain a minimum balance of {walletSettings.minAmount || 10} PKR.
                        Available after minimum: {formatCurrency(netWallet)}
                      </Text>
                    </Alert>
                  )}
                </Card>
              </>
            )}
          </Tabs.Panel>

          {/* History Tab */}
          <Tabs.Panel value="history" pt="xl">
            <Card withBorder shadow="sm">
              <Group position="apart" mb="md">
                <Title order={3}>Request History</Title>
                <Button 
                  variant="light"
                  onClick={handleViewHistory}
                  leftIcon={<IconHistory size={16} />}
                >
                  View Full Timeline
                </Button>
              </Group>

              <Table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Package</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {userRequests?.data?.length > 0 || activationRequests?.data?.length > 0 ? (
                    <>
                      {activationRequests?.data?.map((req: any) => {
                        const requestedPkg = packages.find(p => p._id === req.package_id);
                        return (
                          <tr key={req._id} className={classes.tableRow}>
                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td>
                              <Badge color="blue">Activation</Badge>
                            </td>
                            <td>{requestedPkg?.title || 'N/A'}</td>
                            <td>{formatCurrency(req.amount)}</td>
                            <td>
                              <Badge color={
                                req.status === 'approved' ? 'green' :
                                req.status === 'rejected' ? 'red' : 'yellow'
                              }>
                                {req.status}
                              </Badge>
                            </td>
                            <td>{req.remarks || '-'}</td>
                          </tr>
                        );
                      })}
                      {userRequests?.data?.map((req: any) => {
                        const requestedPkg = packages.find(p => p._id === req.requested_package);
                        return (
                          <tr key={req._id} className={classes.tableRow}>
                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                            <td>
                              <Badge color="green">Upgrade</Badge>
                            </td>
                            <td>{requestedPkg?.title}</td>
                            <td>{formatCurrency(req.amount)}</td>
                            <td>
                              <Badge color={
                                req.status === 'approved' ? 'green' :
                                req.status === 'rejected' ? 'red' : 'yellow'
                              }>
                                {req.status}
                              </Badge>
                            </td>
                            <td>{req.remarks || '-'}</td>
                          </tr>
                        );
                      })}
                    </>
                  ) : (
                    <tr>
                      <td colSpan={6} align="center">
                        <Text color="dimmed" py="xl">No request history found</Text>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Paper>

      {/* Current Package Activation Modal */}
      <Modal
        opened={currentPackageActivationModal}
        onClose={() => {
          if (activateCurrentPackageMutation.isLoading) return;
          setCurrentPackageActivationModal(false);
          currentPackageActivationForm.reset();
          setPaymentFile(null);
          setPaymentPreview(null);
          setActiveStep(0);
        }}
        title={`Activate ${currentPackage?.title} Package`}
        size="lg"
        overlayBlur={3}
        closeOnClickOutside={!activateCurrentPackageMutation.isLoading}
        closeOnEscape={!activateCurrentPackageMutation.isLoading}
      >
        <Stepper active={activeStep} onStepClick={setActiveStep} breakpoint="sm">
          <Stepper.Step label="Step 1" description="Package Details">
            <Card withBorder mb="md">
              <Title order={4}>Package Information</Title>
              <SimpleGrid cols={2} mt="md">
                <div>
                  <Text size="sm" color="dimmed">Package Name</Text>
                  <Text weight={600}>{currentPackage?.title}</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">Price</Text>
                  <Text weight={600} color="blue">{formatCurrency(currentPackage?.price)}</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">Commission Rate</Text>
                  <Text weight={600}>{currentPackage?.commission}%</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">Discount Percentage</Text>
                  <Text weight={600}>{currentPackage?.discount_percentage?.toLocaleString() || "1,000"} %</Text>
                </div>
              </SimpleGrid>
            </Card>

            {/* Bank Details Button */}
            <Card withBorder mb="md" bg="blue.0">
              <Group position="apart" align="center">
                <div>
                  <Text size="sm" weight={600} mb={4}>View company bank account information</Text>
                </div>
                <Button
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={() => setPaymentModalOpened(true)}
                >
                  View Bank Details
                </Button>
              </Group>
            </Card>
            
            <Button 
              onClick={() => setActiveStep(1)} 
              fullWidth
              leftIcon={<IconArrowRight size={16} />}
            >
              Continue to Payment
            </Button>
          </Stepper.Step>

          <Stepper.Step label="Step 2" description="Payment Information">
            <form onSubmit={currentPackageActivationForm.onSubmit((values) => {
              if (hasPendingActivationRequest) {
                showNotification({
                  title: "Request Pending",
                  message: "You already have a pending activation request",
                  color: "yellow",
                });
                return;
              }
              
              if (!paymentFile) {
                showNotification({
                  title: "Error",
                  message: "Please upload payment screenshot",
                  color: "red",
                });
                return;
              }
              activateCurrentPackageMutation.mutate(values);
            })}>
              <Stack spacing="md">
                {/* Bank Details Reminder */}
                <Card withBorder bg="yellow.0" mb="md">
                  <Group position="apart" align="flex-start">
                    <div>
                      <Group spacing="xs" mb={4}>
                        <Text size="sm" weight={600}>Payment Instructions</Text>
                      </Group>
                      <Text size="xs" color="dimmed">
                        Transfer <strong>{formatCurrency(currentPackage?.price)}</strong> to company bank account
                      </Text>
                      <Button
                        variant="subtle"
                        size="xs"
                        compact
                        color="blue"
                        onClick={() => setPaymentModalOpened(true)}
                        mt={4}
                      >
                        View Bank Account Details
                      </Button>
                    </div>
                    <Badge color="blue" variant="filled">Required</Badge>
                  </Group>
                </Card>

                <Card withBorder bg="blue.0" mb="md">
                  <Text size="sm" color="dimmed">Activation Amount</Text>
                  <Text style={{ fontSize: 28 }} weight={900} color="blue">
                    {formatCurrency(currentPackage?.price)}
                  </Text>
                </Card>

                <TextInput
                  label="Transaction ID"
                  placeholder="Enter your payment transaction ID"
                  required
                  description="Transaction ID from your bank transfer"
                  icon={<IconReceipt size={16} />}
                  {...currentPackageActivationForm.getInputProps("transaction_id")}
                  disabled={activateCurrentPackageMutation.isLoading}
                />

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
                          <Text size="sm" color="dimmed">Screenshot uploaded</Text>
                        </Group>
                        <Button
                          size="xs"
                          color="red"
                          variant="light"
                          onClick={() => setPaymentFile(null)}
                          leftIcon={<IconX size={14} />}
                          disabled={activateCurrentPackageMutation.isLoading}
                        >
                          Remove
                        </Button>
                      </Group>
                    </Card>
                  ) : (
                    <FileButton
                      onChange={setPaymentFile}
                      accept="image/png,image/jpeg,image/webp"
                      disabled={activateCurrentPackageMutation.isLoading}
                    >
                      {(props) => (
                        <Button 
                          {...props} 
                          variant="light" 
                          leftIcon={<IconUpload size={16} />}
                          fullWidth
                          disabled={activateCurrentPackageMutation.isLoading}
                        >
                          Upload Payment Screenshot
                        </Button>
                      )}
                    </FileButton>
                  )}
                </div>

                <Group grow>
                  <Button
                    variant="default"
                    onClick={() => setActiveStep(0)}
                    disabled={activateCurrentPackageMutation.isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    loading={activateCurrentPackageMutation.isLoading}
                    disabled={!paymentFile || hasPendingActivationRequest}
                    color="green"
                    leftIcon={<IconCheck size={16} />}
                  >
                    Submit Activation
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stepper.Step>

          <Stepper.Completed>
            <Card withBorder>
              <Group position="center" mb="md">
                <Avatar color="green" radius="xl" size={60}>
                  <IconCheck size={30} />
                </Avatar>
              </Group>
              <Title order={4} align="center" mb="md">Activation Request Submitted!</Title>
              <Text align="center" color="dimmed" mb="md">
                Your activation request has been submitted successfully. 
                The admin will review your payment and activate your package.
              </Text>
              
              <Card withBorder p="md" mb="md" bg="gray.0">
                <SimpleGrid cols={2} spacing="xs">
                  <div>
                    <Text size="xs" color="dimmed">Package</Text>
                    <Text weight={600}>{currentPackage?.title}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Amount</Text>
                    <Text weight={600} color="blue">{formatCurrency(currentPackage?.price)}</Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Transaction ID</Text>
                    <Text weight={600} style={{ fontFamily: 'monospace' }}>
                      {currentPackageActivationForm.values.transaction_id}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Status</Text>
                    <Badge color="yellow" variant="filled">Pending Review</Badge>
                  </div>
                </SimpleGrid>
              </Card>

              <Alert icon={<IconInfoCircle size={16} />} color="blue" mb="md">
                <Text size="sm">
                  <strong>Note:</strong> You can view your payment status in your profile section.
                  Processing time is 24-48 hours.
                </Text>
              </Alert>

              <Button 
                fullWidth 
                mt="md"
                onClick={() => {
                  setCurrentPackageActivationModal(false);
                  setActiveStep(0);
                  currentPackageActivationForm.reset();
                  setPaymentFile(null);
                  setPaymentPreview(null);
                }}
                variant="light"
              >
                Close
              </Button>
            </Card>
          </Stepper.Completed>
        </Stepper>
      </Modal>

      {/* Withdrawal Request Modal */}
      <Modal
        opened={withdrawalModalOpened}
        onClose={() => {
          if (withdrawalMutation.isLoading) return;
          setWithdrawalModalOpened(false);
        }}
        title="Request Withdrawal"
        size="md"
      >
        <form onSubmit={withdrawalForm.onSubmit((values) => withdrawalMutation.mutate(values))}>
          <Stack spacing="md">
            <Alert color="blue" icon={<IconInfoCircle size={16} />}>
              <Text size="sm">
                Minimum amount to keep in wallet: {formatCurrency(walletSettings.minAmount || 10)}
                <br />
                Available for withdrawal: {formatCurrency(Math.max(netWallet, 0))}
              </Text>
            </Alert>

            <NumberInput
              label="Withdrawal Amount"
              value={withdrawalForm.values.amount}
              onChange={(value) => {
                const numValue = Number(value) || 0;
                withdrawalForm.setFieldValue('amount', numValue);
              }}
              min={0.01}
              required
              disabled={!canWithdraw}
              parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
              error={
                withdrawalForm.values.amount > netWallet 
                  ? `Maximum amount is ${formatCurrency(netWallet)}`
                  : withdrawalForm.errors.amount
              }
            />

            <Select
              label="Select Bank Account"
              placeholder="Choose your bank account"
              data={accounts}
              value={withdrawalForm.values.accountId}
              onChange={(value) => withdrawalForm.setFieldValue('accountId', value || '')}
              required
              searchable
              nothingFound="No bank accounts found. Please add one in settings."
            />

            <TextInput
              label="Notes (Optional)"
              placeholder="Add any notes for admin"
              {...withdrawalForm.getInputProps('notes')}
            />

            <Button
              type="submit"
              loading={withdrawalMutation.isLoading}
              disabled={!canWithdraw || !withdrawalForm.values.accountId || withdrawalForm.values.amount <= 0 || withdrawalForm.values.amount > netWallet}
              color="green"
              fullWidth
            >
              Submit Withdrawal Request
            </Button>

            {!canWithdraw && (
              <Alert color="red" icon={<IconAlertCircle size={16} />}>
                <Text size="sm">
                  Cannot withdraw. You need to maintain a minimum balance of {formatCurrency(walletSettings.minAmount || 10)}.
                </Text>
              </Alert>
            )}
          </Stack>
        </form>
      </Modal>

      {/* Approve Withdrawal Request Modal */}
      <Modal
        opened={acceptModal}
        onClose={() => setAcceptModal(false)}
        size={600}
        withCloseButton={true}
        title="Payment Request"
      >
        <Box component="div">
          <Text>Request Amount: {formatCurrency(acceptRequest.amountRequested)}</Text>
        </Box>
        <Box component="div">
          <NumberInput
            label="Amount"
            mb={12}
            value={acceptRequest.amountAccepted}
            onChange={(e: number) =>
              setAcceptRequest((prev: any) => ({ ...prev, amountAccepted: e }))
            }
          />
          <Button
            sx={{ width: "100%" }}
            color="teal"
            onClick={() => handleAcceptRequest(acceptRequest)}
            disabled={
              acceptRequest.amountAccepted > acceptRequest.amountRequested
            }
          >
            Confirm
          </Button>
        </Box>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        opened={paymentModalOpened}
        onClose={() => setPaymentModalOpened(false)}
        title="Company Bank Details"
        size="md"
      >
        {bankLoading ? (
          <Center p="xl"><Loader /></Center>
        ) : companyBank ? (
          <Stack spacing="md">
            <Card withBorder>
              <Text size="sm" color="dimmed">Bank Name</Text>
              <Text weight={600} size="lg">{companyBank.bankName}</Text>
            </Card>
            
            <Card withBorder>
              <Text size="sm" color="dimmed">Account Title</Text>
              <Text weight={600} size="lg">{companyBank.accountTitle}</Text>
            </Card>
            
            <Card withBorder>
              <Text size="sm" color="dimmed">Account Number</Text>
              <Group position="apart">
                <Text weight={600} size="lg">{companyBank.accountNumber}</Text>
                <CopyButton value={companyBank.accountNumber}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied" : "Copy"}>
                      <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Card>
            
            <Card withBorder>
              <Text size="sm" color="dimmed">IBAN</Text>
              <Group position="apart">
                <Text weight={600} size="lg">{companyBank.iban}</Text>
                <CopyButton value={companyBank.iban}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? "Copied" : "Copy"}>
                      <ActionIcon color={copied ? "teal" : "gray"} onClick={copy}>
                        <IconCopy size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </Card>
            
            <Alert color="blue" icon={<IconAlertCircle />}>
              <Text size="sm">
                Kindly acknowledge receipt and confirm once the payment is processed from your end.
              </Text>
            </Alert>
          </Stack>
        ) : (
          <Text color="dimmed">Bank details not available</Text>
        )}
      </Modal>

      {/* History Timeline Modal */}
      <Modal
        opened={historyModalOpened}
        onClose={() => setHistoryModalOpened(false)}
        title="Request History Timeline"
        size="lg"
      >
        {historyLoading ? (
          <Center p="xl"><Loader /></Center>
        ) : upgradeHistory?.data?.length > 0 ? (
          <Timeline active={upgradeHistory.data.length - 1} bulletSize={24} lineWidth={2}>
            {upgradeHistory.data.map((req: any, index: number) => {
              const requestedPkg = packages.find(p => p._id === req.requested_package);
              const currentPkg = packages.find(p => p._id === req.current_package);
              
              return (
                <Timeline.Item 
                  key={req._id}
                  title={
                    <Text weight={600} size="lg">
                      {req.type === 'activation' ? 'Package Activation' : 'Package Upgrade'}
                    </Text>
                  }
                  bullet={
                    <Badge 
                      size="xs" 
                      radius="xl"
                      color={
                        req.status === 'approved' ? 'green' :
                        req.status === 'rejected' ? 'red' : 'yellow'
                      }
                    >
                      {index + 1}
                    </Badge>
                  }
                >
                  <Group spacing="xs" mb={4}>
                    <Badge 
                      color={
                        req.status === 'approved' ? 'green' :
                        req.status === 'rejected' ? 'red' : 'yellow'
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
                      <Text size="sm" color="dimmed">From Package:</Text>
                      <Text>{currentPkg?.title || "None"}</Text>
                    </div>
                    <div>
                      <Text size="sm" color="dimmed">To Package:</Text>
                      <Text>{requestedPkg?.title || "N/A"}</Text>
                    </div>
                  </SimpleGrid>
                  
                  <Group spacing="lg">
                    <Text size="sm">
                      <Text span color="dimmed">Amount: </Text>
                      {formatCurrency(req.amount)}
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
            No history found.
          </Text>
        )}
      </Modal>
    </Box>
  );
}