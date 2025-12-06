import {
  Button,
  createStyles,
  Title,
  Tabs,
  Modal,
  NumberInput,
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
import { FinancialList } from "../components/FinancialList";
import { FinancialListRequest } from "../components/FinancialListRequests";
import axiosConfig from "../configs/axios";
import { BankAccount } from "../Types/types";
import { ACCOUNTS, FINANCIALS } from "../utils/API_CONSTANT";

const useStyles = createStyles(() => ({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "start",
    width: "100%",
  },
}));

//FetchBankAccount 
/**********************Fetch Bank Accounts Start*************************************** */

const fetchUserBankAccounts = async ({ queryKey }: any) => {
  const [_, { search, page, limit, user, ...filters }] = queryKey;
  const params = new URLSearchParams(filters);
  const userstore = JSON.parse(sessionStorage.getItem("user") || "{}");

  const url =
    userstore.role !== "Admin"
      ? `${ACCOUNTS}/user/${user}?search=${search}&page=${page}&limit=100&${params}`
      : `${ACCOUNTS}/?search=${search}&page=${page}&limit=${limit}&${params}`;

  const res: AxiosResponse = await axiosConfig.get(url);
  return res.data;
};

/*****************************Fetch bank Accounts End*********************************** */




export function Financials() {
  const [requestAmount, setRequestAmount] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [revenue, setRevenue] = useState<any>({});





  const [account, setAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState([]);

  const { classes } = useStyles();

  const user = JSON.parse(sessionStorage.getItem("user") || "{}");

  const [filters, setfilters] = useState({
    search: "",
    limit: 10,
    page: 1,
    user:
      user.role === "Vendor" || user.role === "Referrer" ? user._id : "",
    type: "",
    bankName: "",
    account_number: "",
    iban: "",
  });

  /** ----------------------- USER ACCOUNTS QUERY ------------------------ **/
  const { data: userAccounts } = useQuery(
    ["userAccounts", filters],
    fetchUserBankAccounts,
    { refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (userAccounts) {
      const acc = userAccounts.data.docs.map((account: BankAccount) => ({
        ...account,
        value: account._id,
        label: account.title,
      }));
      setAccounts(acc);
    }
  }, [userAccounts]);


/** ----------------------- PENDING REQUESTS QUERY ------------------------ **/
const {
  data: pendingRequests,
  refetch: refetchPending,
} = useQuery(["pendingRequests", user._id], async () => {
  const res = await axiosConfig.get(`${FINANCIALS}/requests/?user=${user._id}&page=1&limit=100`);
  return res.data.data.docs;
});
















/***************************Pending Reqeust End*************************************************** */







/**********************Pending Request functions start************************************************ */


const pendingAmount = pendingRequests
  ?.filter((r: any) => r.status === "Pending")
  ?.reduce((sum: number, r: any) => sum + (r.amountRequested || 0), 0) || 0;


/****************************pending function variable end***************************************** */




///all calculations after button
  






/**********************Rejected calc function******************************/

const rejectedAmount = pendingRequests
  ?.filter((r: any) => r.status === "Rejected")
  ?.reduce((sum: number, r: any) => sum + (r.amountRequested || 0), 0) || 0;



/*********************************Rejected Calc function end******************* */



useEffect(() => {
  if (paymentModal) {
    setRequestAmount(revenue?.walletAmount - pendingAmount);
  }
}, [paymentModal, revenue, pendingAmount]);





  /** ----------------------- WALLET QUERY ------------------------ **/
  const {
    data: WalletData,
    refetch: refetchWallet,
  } = useQuery(
    ["wallet", user._id],
    async () => {
      const params = new URLSearchParams({
        darsi: user.role === "Admin" ? "true" : "false",
      });

      const res = await axiosConfig.get(
        `${FINANCIALS}/get-revenue-total/${user._id}?${params}`
      );

      return res.data.data;
    },
    { refetchOnWindowFocus: true }
  );

  useEffect(() => {
    if (WalletData) {
      setRevenue(WalletData);
      setRequestAmount(WalletData.walletAmount);
    }
  }, [WalletData]);



 



  /** ----------------------- PAYABLE QUERY ------------------------ **/
  const {
    data: payable,
    isLoading: payableLoading,
    refetch: refetchPayable,
  } = useQuery(["payable", user._id], async () => {
    const res = await axiosConfig.get(`${FINANCIALS}/payable/${user._id}`);
    return res.data.data;
  });

  /** REFRESH WALLET WHEN LIST CHANGES (page, limit, search, etc.) **/
  useEffect(() => {
    refetchWallet();
    refetchPayable();
    refetchPending();

  }, [filters]);

  /** ----------------------- PAYMENT SUBMISSION ------------------------ **/
  async function handleSubmitMakePayment() {
    setSubmitting(true);

    const res = await axiosConfig.post(FINANCIALS + "/make-payment-request", {
      user: user._id,
      darsi: user.role === "Admin" ? true : false,
      amount: requestAmount,
      accountId: account,
    });

    if (res.status === 200) {
      await refetchWallet();
      await refetchPayable();
      await refetchPending();


      setPaymentModal(false);

      showNotification({
        title: "Success",
        message: res.data.message,
        icon: <IconCheck />,
        color: "teal",
      });
    }

    setSubmitting(false);
  }

  /** ----------------------- WALLET LIMIT QUERY ------------------------ **/
  const { data: wallets } = useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const res = await axiosConfig.get("/wallets");
      return res.data;
    },
  });
  const minHold = wallets?.data[0].minAmount; // Company holds 10 Rs

   const netWallet = revenue?.walletAmount - pendingAmount;
      const maxWithdraw = netWallet - minHold; // max withdrawable
      const minWithdraw = 0.01; // Minimum amount must be greater than 0
      const canWithdraw = maxWithdraw > minWithdraw; // true if user can withdraw

      const isAmountValid =
      requestAmount > minWithdraw && requestAmount <= maxWithdraw;

  const [tabChanged, toggle] = useToggle([true, false]);
  const [searchParams] = useSearchParams();

  return (
    <>
      <div className={classes.header}>
        <Title>Financial</Title>
      </div>

      {/* BUTTON */}
      <div style={{ display: "flex", justifyContent: "end", marginBottom: "16px" }}>
        {user.role !== "Admin" && (
          <Button
            size="sm"
            leftIcon={<IconMoneybag size={16} />}
            onClick={() => setPaymentModal(true)}
            disabled={!revenue.walletAmount}
          >
            Make a request
          </Button>
        )}
      </div>

      {/* SUMMARY BOX */}
      <Box sx={{ display: "flex", gap: "20px" }}>
        <Text>Wallet: {revenue?.walletAmount?.toFixed(2) ?? "0.00"}</Text>
        <Text>Withdraw: {revenue?.withdraw ?? 0}</Text>
        <Text>Payable: {!payableLoading && payable?.data?.payable}</Text>
         <Text>Pending: {pendingAmount.toFixed(2) ?? "0.00" } </Text>
         <Text>Rejected: {rejectedAmount.toFixed(2) ?? "0.00"} </Text>
         <Text>Net Wallet: {revenue?.walletAmount-pendingAmount} </Text>
         {/* <Text>Net Wallet2: {(revenue?.walletAmount-pendingAmount)+rejectedAmount} </Text> */}

      </Box>

      {/* TABS */}
      <Tabs
        defaultValue={
          searchParams.get("activeTab")
            ? "Payment Requests"
            : "Financial Entries"
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
            activeTab={searchParams.get("activeTab") || "All"}
          />
        </Tabs.Panel>
      </Tabs>

      {/* PAYMENT MODAL */}
  <Modal
  opened={paymentModal}
  onClose={() => setPaymentModal(false)}
  size={600}
  title="Make a new payment request"
>
  <Box>
    <Text>Available Balance: {revenue?.walletAmount - pendingAmount}</Text>
   

      <Alert
              icon={<IconInfoCircle size={16} />}
              
              color="red"
              my="sm"
            >
              You must keep a minimum balance of {minHold} Rs.
            </Alert>
    
  </Box>

  <Box>
    {(() => {
    

      return (
        <>
          <NumberInput
            label="Amount"
            mb={12}
            value={requestAmount || (canWithdraw ? minWithdraw : 0)}
            onChange={(value) => setRequestAmount(Number(value) || 0)}
            min={minWithdraw}
            max={maxWithdraw}
            disabled={!canWithdraw}
          />

          <Select
            placeholder="Select your account..."
            required
            data={accounts}
            value={account}
            onChange={setAccount}
            disabled={!canWithdraw}
          />

          <Button
            fullWidth
            color="teal"
            onClick={handleSubmitMakePayment}
            disabled={submitting || !isAmountValid || !canWithdraw}
          >
            {submitting ? "Processing..." : "Confirm"}
          </Button>

          {!canWithdraw && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Insufficient Balance"
              color="red"
              my="sm"
            >
              You must keep a minimum balance of {minHold} Rs. Cannot withdraw.
            </Alert>
          )}

          {requestAmount <= 0 && canWithdraw && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              title="Invalid Amount"
              color="red"
              my="sm"
            >
              Withdrawable amount must be greater than 0.
            </Alert>
          )}
        </>
      );
    })()}
  </Box>
</Modal>




    </>
  );
}
