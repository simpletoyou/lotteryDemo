/*
 * @Description: 
 * @version: 
 * @Author: chenchuhua
 * @Date: 2021-06-07 19:24:13
 * @LastEditors: chenchuhua
 * @LastEditTime: 2021-06-08 11:14:57
 */
const LotteryCoin = artifacts.require("LotteryCoin");
const LotteryShop = artifacts.require("LotteryShop");
const ConvertLib = artifacts.require("ConvertLib");
const MetaCoin = artifacts.require("MetaCoin");

// module.exports = function(deployer) {
//   deployer.deploy(LotteryCoin);
//   deployer.deploy(LotteryShop, LotteryCoin.address);
// };


// module.exports = function(deployer) {
//   deployer.deploy(LotteryCoin);
//   deployer.deploy(LotteryShop, LotteryCoin.address);
// };

module.exports = function(deployer) {
  deployer.deploy(LotteryCoin).then(function() {
    return deployer.deploy(LotteryShop, LotteryCoin.address);
  });
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
};
