pragma solidity >=0.4.21 <0.6.0;

import "./Owned.sol";
import "./TokenERC20.sol";

contract LotteryCoin is owned, TokenERC20 {

    uint256 public sellPrice;
    uint256 public buyPrice;

    mapping (address => bool) public frozenAccount;

    /* This generates a public event on the blockchain that will notify clients */
    event FrozenFunds(address target, bool frozen);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    constructor() TokenERC20(1e8, "LotteryCoin", "LTC") public {
        sellPrice = 1 finney;
        buyPrice  = 1 finney;
    }

    /* Internal transfer, only can be called by this contract */
    function _transfer(address _from, address _to, uint _value) internal {
        // 如果 接收方为address(0x0)， return
        require (_to != address(0x0)); 
        // 判断发送方余额是否大于所交易金额                         // Prevent transfer to 0x0 address. Use burn() instead
        require (balanceOf[_from] >= _value);                   // Check if the sender has enough
        // Check for overflows ？？？
        require (balanceOf[_to] + _value >= balanceOf[_to]);    // Check for overflows
        // 判断发送方账户是否被冻结
        require(!frozenAccount[_from]);                         // Check if sender is frozen
        // 判断接收方是否被冻结
        require(!frozenAccount[_to]);                           // Check if recipient is frozen
        // 发送方余额-value
        balanceOf[_from] -= _value;                             // Subtract from the sender
         // 接收方余额+value
        balanceOf[_to] += _value;                               // Add the same to the recipient
        //发生交易
        emit Transfer(_from, _to, _value);
    }
    function mintToken(address target, uint256 mintedAmount) onlyOwner public {
        balanceOf[target] += mintedAmount;
        totalSupply += mintedAmount;
        emit Transfer(address(0), address(this), mintedAmount);
        emit Transfer(address(this), target, mintedAmount);
    }

    function freezeAccount(address target, bool freeze) onlyOwner public {
        frozenAccount[target] = freeze;
        emit FrozenFunds(target, freeze);
    }

    function setPrices(uint256 newSellPrice, uint256 newBuyPrice) onlyOwner public {
        sellPrice = newSellPrice;
        buyPrice = newBuyPrice;
    }

    function buy() payable public {
        uint amount = msg.value / buyPrice * 10 ** uint256(decimals);
        _transfer(address(this), msg.sender, amount);
    }

    function sell(uint256 a) public {
        address myAddress = address(this);
        uint256 amount = a * 10 ** uint256(decimals);
        require(myAddress.balance >= amount * sellPrice);   // checks if the contract has enough ether to buy
        _transfer(msg.sender, address(this), amount);       // makes the transfers
        msg.sender.transfer(amount * sellPrice);            // sends ether to the seller. It's important to do this last to avoid recursion attacks
    }
}