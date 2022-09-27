const Web3 = require("web3");
require("dotenv").config()
const web3 = new Web3("wss://bsc-testnet.nodereal.io/ws/v1/296ebea9f094419787c3a0bd8769f8fb");

PANCAKELP_ADDRESS = "0xee31A5AdE519Be9275e9D19E07762003384d1496"
PANCAKE_ROUTER_ADDRESS = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
IDO_TOKEN_ADDRESS = "0x054A3EE28bF85E3239091fcf5A646F30407FC0E8"

const APPROVE_AMOUNT = "1000000000000000000000000000"
const AMOUNT = "100000000000000" //1 BNB
const SLIPPAGE = 5; //5%
let WBNB;

let accounts = []
for (i = 0; i < JSON.parse(process.env.PRIVATE_KEY).length; i++) {
    account = web3.eth.accounts.privateKeyToAccount(JSON.parse(process.env.PRIVATE_KEY)[i])
    accounts.push(account.address)
    web3.eth.accounts.wallet.add(account);
    console.log("account", i, account.address);
}

const pancakeLp = new web3.eth.Contract(JSON.parse(process.env.PANCAKELP_ABI), PANCAKELP_ADDRESS);
const pancakeRouter = new web3.eth.Contract(JSON.parse(process.env.PANCAKE_ROUTER_ABI), PANCAKE_ROUTER_ADDRESS);
const idoToken = new web3.eth.Contract(JSON.parse(process.env.ERC20_ABI), IDO_TOKEN_ADDRESS);

start();





async function start() {
    WBNB = await pancakeRouter.methods.WETH().call();
    console.log("WBNB", WBNB);
    // await approve();
    pancakeLp.events.Mint({
        filter: {
            fromBlock: "lastest"
        }
    }, async function (error, event) {
        console.log("LP Address: ", event.transactionHash);
        await swap();
    })

}

async function swap() {
    try {

        for (i = 0; i < accounts.length; i++) {
            const amountOut = (
                await pancakeRouter.methods
                    .getAmountsOut(AMOUNT, [WBNB, IDO_TOKEN_ADDRESS])
                    .call()
            )[1];
            const amountOutMin = (amountOut - (amountOut * SLIPPAGE) / 100).toLocaleString("fullwide", {
                useGrouping: false,
            });
            console.log("amountOutMin", amountOutMin);
            const tx = await pancakeRouter.methods.swapExactETHForTokens(amountOutMin, [WBNB, IDO_TOKEN_ADDRESS], accounts[i], parseInt(Date.now() / 1000) + 600).send({ from: accounts[i], gas: 500000, value: AMOUNT });
            console.log("Tx swap", tx.transactionHash);
        }


    } catch (err) {
        console.log(err);
        swap();
    }
}

async function approve() {
    for (i = 0; i < accounts.length; i++) {
        try {
            const allowance = await idoToken.methods.allowance(accounts[i], PANCAKE_ROUTER_ADDRESS).call();
            console.log(accounts[i], "allowance", allowance);
            if (allowance == 0) {
                const tx = await idoToken.methods.approve(PANCAKE_ROUTER_ADDRESS, APPROVE_AMOUNT).send({ from: accounts[i], gas: 200000 });
                console.log(accounts[i], "approve", tx.transactionHash);
            }

        } catch (err) {
            console.log(err);
        }
    }

}


