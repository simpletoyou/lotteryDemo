import Web3 from "web3";
import coin_artifacts from '../build/contracts/LotteryCoin.json'
import shop_artifacts from '../build/contracts/LotteryShop.json'

const App = {
  web3: null,
  account: null,
  coin: null,
  shop: null,

  init: async function () {
    // 连接合约
    const {web3} = this;
    try {
      // 与合约交互正常

      // 获取当前的网络 ID.
      const networkId = await web3.eth.net.getId();

      // 与以太坊区块链上的智能合约进行交互。 当你创建一个新的合约对象时，只需要指定相应的智能合约 json 接口， web3 就会自动将所有的调用转换为基于 RPC 的底层 ABI 调用。

      // LotteryCoin.sol
      this.coin = new web3.eth.Contract(
          coin_artifacts.abi,
          coin_artifacts.networks[networkId].address,//要调用的智能合约地址
      );
      console.log('this.coin',this.coin)

      // 获取账户
      const accounts = await web3.eth.getAccounts();
      console.log('accounts',accounts)
      this.account = accounts[0];
      
      // LotteryShop.sol
      this.shop = new web3.eth.Contract(
          shop_artifacts.abi,
          shop_artifacts.networks[networkId].address,
      );
      console.log('this.shop',this.shop)

      this.loadBasicInfo();
    } catch (error) {
       // 与合约交互异常
      console.error("Could not connect to contract or chain.");
    }
  },

  //管理员可见
  loadTokenPrice : async function() {
    console.log('管理员可见：loadTokenPrice----start')

    const {sellPrice, buyPrice} = this.coin.methods;

    const sell_price = await sellPrice().call()
    console.log('sell_price',sell_price)
    const sell_price_infin = this.web3.utils.fromWei(sell_price, 'finney')
    console.log('sell_price_infin',sell_price_infin)

    const buy_price = await buyPrice().call()
    console.log('buy_price',buy_price)

    const buy_price_infin = this.web3.utils.fromWei(buy_price, 'finney')
    console.log('buy_price_infin',buy_price_infin)



    $("#sell-price").val(sell_price_infin)
    $("#buy-price").val(buy_price_infin)

    $("#buyTokenNo-msg")[0].innerText = "售价/token:"+sell_price_infin +" finney"

    console.log('管理员可见：loadTokenPrice----end')
  },

  // 获取当前账号的eth余额--successfully
  loadEthBalance: async function(){
    const accEthEl = $("#account-eth")[0]
    this.web3.eth.getBalance(this.account).then(
        (result) =>{
          const balanceInEth = this.web3.utils.fromWei(result, 'ether')
          accEthEl.innerText = balanceInEth +" ETH"
        }
    )
  },

  // 获取当前账号的token余额--successfully
  loadTokenBalance: async function(){
    const {balanceOf} = this.coin.methods
    const tokenBEl = $("#account-token")[0]
    const tokenB = await balanceOf(this.account).call()
    tokenBEl.innerText = (tokenB / 100) + " LTC"
  },

  // 获取我的下注？
  loadCurrentBets:async function(){
    const {allMyBets} = this.shop.methods
    const tBody = $("#bets-rows")
    tBody.empty()
    console.log(111)
    allMyBets().call({from:this.account}).then(
        (result)=>{
          console.log(222)
          console.warn("result:->",result)
          const strs = result[0]
          const nos = result[1]
          for (let i = 0; i < strs.length; i++) {
            tBody.append("<tr><td>" + this.web3.utils.hexToString(strs[i]) + "</td><td>" + nos[i] + "</td></tr>")
          }
          if ( result[2] == true){
            $("#this-phase-msg")[0].innerText = "当前投注已经停止，中奖者地址:" + result[3]
          }else{
            $("#this-phase-msg")[0].innerText = ""
          }
        }
    )
  },

  // loadBasicInfo
  loadBasicInfo :async function (){
    
    const {owner} = this.coin.methods;
    const adminAddr = await owner().call()

    console.log('adminAddr',adminAddr)

    if (this.account == adminAddr){
      console.log('show admin')
      $("#admin-area").show()
    }else{
      console.log('hide admin')
      $("#admin-area").hide()
    }

    // 管理员可见----获取sell_price、buy_price
    this.loadTokenPrice()
    //获取当前账号的eth余额
    this.loadEthBalance()
    //获取当前账号的token余额
    this.loadTokenBalance()
    this.loadCurrentBets()
  },

  buyTokens: async function (){
    const { buy, sell } = this.coin.methods;

    let no = $("#buyTokenSum").val()
    if (no <= 0){
      alert("无效的金额")
      return
    }
    console.warn(this.web3.utils.toWei(no, "ether"))

    buy().send({value:this.web3.utils.toWei(no, "ether"), from: this.account
      }).on('error', function(error){
        console.error(error)
      }).on('transactionHash', (txHash) =>{
            console.warn("transactionHash",txHash)

      }).on('confirmation', (confirmationNumber, receipt) =>{
          console.warn(confirmationNumber, receipt)
      }).on('receipt', (receipt) =>{
        console.warn("receipt", receipt)
        alert("购买成功")
        this.loadEthBalance()
        this.loadTokenBalance()
    });
  },

  bidThisPhase :async function (){
    const bidStr = $("#bidSerial").val()
    if (bidStr.length != 3){
      alert("请输入3位彩票序列")
      return
    }

    const sum = $("#bidSum").val()
    if (sum <= 0){
      alert("请输入合适的投注数")
      return
    }

    const {bet} = this.shop.methods

    bet(this.web3.utils.utf8ToHex(bidStr), sum).send({from:this.account}).on(
        'transactionHash', (hash) =>{
          console.warn("hash", hash)
        }
    ).on(
        'confirmation', (confirmationNumber, receipt) =>{
          console.warn("confirmation", confirmationNumber, receipt)
        }
    ).on('receipt', (receipt) =>{
      console.warn("receipt", receipt)
      this.loadEthBalance()
      this.loadTokenBalance()
      this.loadCurrentBets()
    })
  },

  findWinner: async function (){
    const {closeAndFindWinner} = this.shop.methods;
    closeAndFindWinner().send({from: this.account}).on(
        'transactionHash', (hash) =>{
          console.warn("hash", hash)
        }
    ).on(
        'confirmation', (confirmationNumber, receipt) =>{
          console.warn("confirmation", confirmationNumber, receipt)
        }
    ).on('receipt', (receipt) =>{
      console.warn("receipt", receipt)
      this.loadCurrentBets()
    })
  },

  reOpen: async function(){
    const {reOpen} = this.shop.methods;
    reOpen().send({from: this.account}).on(
        'transactionHash', (hash) =>{
          console.warn("hash", hash)
        }
    ).on(
        'confirmation', (confirmationNumber, receipt) =>{
          console.warn("confirmation", confirmationNumber, receipt)
        }
    ).on('receipt', (receipt) =>{
      console.warn("receipt", receipt)
      this.loadCurrentBets()
    })
  },

  setPrice :async function (){
    var sp = $("#sell-price").val()
    var bp = $("#buy-price").val()

    if (sp <=0 || bp <= 0){
      alert("检查参数")
      return
    }

    sp = this.web3.utils.toWei(sp, "finney")
    bp = this.web3.utils.toWei(bp, "finney")

    this.coin.methods.setPrices(sp, bp).send({from:this.account}).on(
        'transactionHash', (hash) =>{
            console.warn("hash", hash)
        }
    ).on(
        'confirmation', (confirmationNumber, receipt) =>{
          console.warn("confirmation", confirmationNumber, receipt)
        }
    ).on('receipt', (receipt) =>{
      console.warn("receipt", receipt)
      this.loadTokenPrice()
    })
  },
}

window.App = App;

$(document).ready(function() {
  if (window.ethereum) {
    App.web3 = new Web3(window.ethereum);
    window.ethereum.enable();
    console.warn("用 metamask 的账号")
  } else {
    console.warn(
        "No web3 detected. Falling back to http://127.0.0.1:7545. You should remove this fallback when you deploy live",
    );
    App.web3 = new Web3(
        new Web3.providers.HttpProvider("http://127.0.0.1:7545"),
    );
  }

  App.init();
});