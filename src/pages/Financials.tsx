import {
  Button,
  createStyles,
  Title,
  Tabs,
  Modal,
  NumberInput,
  Divider,
  Box,
  Text,
  Select,
  Alert,
} from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { IconCheck, IconInfoCircle, IconMoneybag } from "@tabler/icons";
import { AxiosResponse } from "axios";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { Filter, PigMoney } from "tabler-icons-react";
import { FinancialList } from "../components/FinancialList";
import { FinancialListRequest } from "../components/FinancialListRequests";
import axiosConfig from "../configs/axios";
import { BankAccount } from "../Types/types";
import { ACCOUNTS, FINANCIALS } from "../utils/API_CONSTANT";

type Props = {};

const useStyles = createStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    width: "100%",
  },
}));

const fetchUserBankAccounts = async ({ queryKey }: any) => {
  const [_, { search, page, limit, user, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const userstore = JSON.parse(sessionStorage.getItem("user") || "{}");

  const url =
    userstore.role !== "Admin"
      ? `${ACCOUNTS}/user/${user}?search=${search}&page=${page}&limit=100&${params}`
      : `${ACCOUNTS}/?search=${search}&page=${page}&limit=${limit}&${params}`;

  const res: AxiosResponse = await axiosConfig.get(url);
  const data = res.data;
  return data;
};

export function Financials({}: Props) {
  const [requestAmount, setRequestAmount] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [revenue, setRevenue]: any = useState({});
  const { classes } = useStyles();
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  // useEffect(() => {
  //   getTotalAmount();
  // }, []);
  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    user: user.role === "Vendor" || "Referrer" ? user._id : "",
    type: "",
    bankName: "",
    account_number: "",
    iban: "",
  });
  const {
    isLoading,
    error,
    data: userAccounts,
    refetch,
  } = useQuery(["userAccounts", filters], fetchUserBankAccounts, {
    enabled: true,
    refetchOnWindowFocus: true,
  });
  const [accounts, setAccounts] = useState([]);
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (userAccounts) {
      const accounts = userAccounts.data.docs.map((account: BankAccount) => ({
        ...account,
        value: account._id,
        label: account.title,
      }));
      setAccounts(accounts);
    }
  }, [userAccounts]);

  // const getTotalAmount = async () => {
  //   let fields = {
  //     darsi: user.role === "Admin" ? "true" : "false",
  //   };
  //   const params = new URLSearchParams(fields);
  //   await axiosConfig
  //     .get(`${FINANCIALS}/get-revenue-total/${user._id}?${params}`)
  //     .then((res) => {
  //       return res.data;
  //     })
  //     .then((response) => {
  //       let data = response.data;
  //       setRevenue(data);
  //       setRequestAmount(data.walletAmount);
  //     });
  // };
  const {
    data: WalletData,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useQuery(
    ["wallet"],
    async () => {
      let fields = {
        darsi: user.role === "Admin" ? "true" : "false",
      };
      const params = new URLSearchParams(fields);
      const res = await axiosConfig.get(
        `${FINANCIALS}/get-revenue-total/${user._id}?${params}`
      );
      const data = res.data.data;
      return data;
    },
    {
      enabled: true,
      refetchOnWindowFocus: true,
    }
  );

  const {
    data: payable,
    isLoading: payableLoading,
    refetch: refetchPayable,
  } = useQuery(
    ["payable"],
    async () => {
      const res = await axiosConfig.get(`${FINANCIALS}/payable/${user._id}`);
      const data = res.data.data;
      return data;
    },
    {
      refetchOnWindowFocus: true,
    }
  );

  useEffect(() => {
    if (isLoadingWallet) return;
    if (WalletData) {
      setRevenue(WalletData);
      setRequestAmount(WalletData.walletAmount);
    }
  }, [isLoadingWallet]);
  async function handleSubmitMakePayment() {
    setSubmitting(true);
    let res = await axiosConfig.post(FINANCIALS + "/make-payment-request", {
      user: user._id,
      darsi: user.role === "Admin" ? true : false,
      amount: requestAmount,
      accountId: account,
    });

    if (res?.status === 200) {
      // await getTotalAmount();
      setPaymentModal(false);
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
    setSubmitting(false);
  }
  useEffect(() => {
    refetchWallet();
  }, [submitting]);
  const { data: wallets, isFetching } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axiosConfig.get("/wallets");
      const data = await res.data;
      return data;
    },
  });
  const [tabChanged, toggle] = useToggle([true, false]);
  let [searchParams, setSearchParams] = useSearchParams();
  let params: Record<string, string | null> = {};

  for (let [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  // console.log(revenue.walletAmount.toFixed(2))
  return (
    <>
      <div className={classes.header}>
        <Title>Financial</Title>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          marginBottom: "16px",
        }}
      >
        <div>
          {user.role !== "Admin" && (
            <Button
              size={"sm"}
              leftIcon={<IconMoneybag size={16} />}
              sx={{ marginRight: 10 }}
              onClick={() => setPaymentModal(true)}
              disabled={!revenue.walletAmount}
            >
              Make a request
            </Button>
          )}
        </div>
      </div>
      <Box sx={{ display: "flex", gap: "20px" }}>
        <Text>Wallet: {revenue?.walletAmount?.toFixed(2) ?? 0}</Text>
        <Text>Withdraw: {revenue.withdraw}</Text>
        <Text>Payable: {!payableLoading && payable?.data?.payable}</Text>
      </Box>
      <Tabs
        defaultValue={
          params.activeTab ? "Payment Requests" : "Financial Entries"
        }
        onTabChange={() => toggle()}
      >
        <Tabs.List>
          <Tabs.Tab value="Financial Entries">Financial Entries</Tabs.Tab>
          <Tabs.Tab value="Payment Requests">Payment Requests</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="Financial Entries" pt="xs">
          <FinancialList paymentRequest={submitting} tabChange={tabChanged} />
        </Tabs.Panel>
        <Tabs.Panel value="Payment Requests" pt="xs">
          <FinancialListRequest
            paymentRequest={submitting}
            tabChange={tabChanged}
            activeTab={params.activeTab || "All"}
          />
        </Tabs.Panel>
      </Tabs>
      <Modal
        opened={paymentModal}
        onClose={() => setPaymentModal(false)}
        size={600}
        withCloseButton={true}
        title="Make a new payment request"
      >
        <Box component="div">
          <Text>Available Balance: {revenue.walletAmount}</Text>
        </Box>
        {revenue.walletAmount >= wallets?.data[0].minAmount ?? 5000 ? (
          <Box component="div">
            <NumberInput
              label="Amount"
              mb={12}
              value={requestAmount}
              onChange={(e: number) => setRequestAmount(e)}
            />
            <Select
              placeholder="Select your account..."
              required
              data={accounts}
              value={account}
              onChange={setAccount}
            />
            <Button
              sx={{ width: "100%" }}
              color="teal"
              onClick={handleSubmitMakePayment}
              my="sm"
              disabled={requestAmount > revenue.walletAmount}
            >
              Confirm
            </Button>
          </Box>
        ) : (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Insufficient Amount"
            my={"sm"}
          >
            Dear User, Your wallet amount is less than{" "}
            {wallets?.data[0].minAmount ?? 5000} you cannot create a Payment
            request for amount less then {wallets?.data[0].minAmount ?? 5000}.
          </Alert>
        )}
      </Modal>
    </>
  );
}
