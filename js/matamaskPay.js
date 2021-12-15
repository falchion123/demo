// window.addEventListener('load', function() {
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        web3 = new  Web3(window.ethereum);
        // try {
        //     // 请求用户授权
        //     window.ethereum.enable();
        // } catch (error) {
        //     // 用户不授权时
        //     console.error("User denied account access")
        // }
        //
        connect()
    }else if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
        if (web3.currentProvider.isMetaMask == true) {
            console.log("MetaMask可用")
        } else {
            console.log( "非MetaMask环境")
        }
    } else {
        alert("No web3? 需要安装<a href='https://metamask.io/'>MetaMask</a>!");
    }
// })

// ethereum.request({ method: 'eth_accounts' })
//     .then(handleAccountsChanged)
//     .catch((err) => {
//         // Some unexpected error.
//         // For backwards compatibility reasons, if no accounts are available,
//         // eth_accounts will return an empty array.
//         console.error(err);
//     });

// Note that this event is emitted on page load.
// If the array of accounts is non-empty, you're already
// connected.
ethereum.on('accountsChanged', handleAccountsChanged);

// For now, 'eth_accounts' will continue to always return an array
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        console.log('Please connect to MetaMask.');
    } else if (dss.account!=""&&accounts[0] !== dss.account) {
        dss.account = accounts[0];
        // Do any other work!
        window.location.reload();
    }
}

// const chainId =  ethereum.request({ method: 'eth_chainId' });
// handleChainChanged(chainId);

ethereum.on('chainChanged', handleChainChanged);

function handleChainChanged(_chainId) {
    // We recommend reloading the page, unless you must do otherwise
    window.location.reload();
}

// While you are awaiting the call to eth_requestAccounts, you should disable
// any buttons the user can click to initiate the request.
// MetaMask will reject any additional requests while the first is still
// pending.
function connect() {
    window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(handleAccountsChanged)
        .catch((err) => {
            if (err.code === 4001) {
                // EIP-1193 userRejectedRequest error
                // If this happens, the user rejected the connection request.
                console.log('Please connect to MetaMask.');
            } else {
                console.error(err);
            }
        });
}


var dss ={
    "debug": true,
    "account":'' ,
    "balance":'',
    "contractABI":'',
    "contractAddr":'',
    "currentAddr":'',
    "txResp" : {transactionHash : 'transactionHash', receipt : "receipt", confirmation : "confirmation", error : "error"},

    contractInit: function(contractAbi,contractAddr,currentAddr){
        dss.contractABI = contractAbi

        if(typeof contractAddr !== 'undefined'){
            dss.contractAddr = contractAddr
        }

        if(typeof currentAddr !== 'undefined'){
            dss.currentAddr =currentAddr
        }
    },
    deployContract: async  function(contractABI,contractCode,params){
            let contractInstance = new web3.eth.Contract(contractABI)
            let accounts = await web3.eth.getAccounts();
            contractInstance.deploy({
                data: contractCode,
                arguments: params
            }).send({
                from: accounts[0],
                // gas: 1500000,
                // gasPrice: '30000000000000'
            }).on('error', function(error) {
                console.log(error)
            }).on('transactionHash', function(transactionHash){
                console.log(transactionHash)
            }).on('receipt', function(receipt){
                console.log(receipt.contractAddress) // 收据中包含了新的合约地址
            }).on('confirmation', function(confirmationNumber, receipt){

            }).then(function(newContractInstance){
                console.log(newContractInstance.options.address) // 新地址的合约实例
            });

        },
    payment:async function(toAddress, balance, orderNo,callback ){//以太坊转账
            try{
                let accounts = await web3.eth.getAccounts();
                let value = web3.utils.toWei(balance,'ether');
                let data = orderNo;
                let estimategas = await web3.eth.estimateGas({
                    to: toAddress,
                    data:web3.utils.fromUtf8(data)
                });

                txParams = {
                    gas: web3.utils.toHex(estimategas),
                    from: accounts[0],
                    to: toAddress,
                    value:value,
                    data:web3.utils.fromUtf8(data)
                }

                await web3.eth.sendTransaction(txParams).on(dss.txResp.transactionHash, function(hash){
                    if(dss.debug){
                        console.log("txhash:"+hash,"sumbit payment")
                    }

                    callback(dss.txResp.transactionHash,hash)
                }).on(dss.txResp.receipt, function(receipt){
                    if(dss.debug){
                        console.log(receipt,"complete payment")
                    }
                    callback(dss.txResp.receipt,receipt)
                // }).on('confirmation', function(confirmationNumber, receipt){
                //     if(dss.debug){
                //         console.log(confirmationNumber,"confirmation payment")
                //     }
                }).on(dss.txResp.error, function(result){
                        console.log(result)
                        callback(dss.txResp.error,result)
                    });
            }catch (error) { // If a out of gas error, the second parameter is the receipt.
                console.log("error==>"+error)
            }

        },

    robinTokenPay:async function(toAddress, amount,callback ){//ROB代币转账
            let contractABI =[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
            let contractAddr = "0x89d91cE6c62C01a6F164640199C9A7242d16b33f"
            dss.contractInit(contractABI,contractAddr)
            dss.tokenPayment(toAddress,amount,callback)
    },


    lpRobTokenPay:async function(toAddress, amount,callback ){//LP-ROB 代币转账
        let contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
        let contractAddr = "0xbbA2b6E596aA86bF9f34CBEb3B48805654D38ee0"
        dss.contractInit(contractABI,contractAddr)
        dss.tokenPayment(toAddress,amount,callback)
    },

    tokenPayment:async function(toAddress, amount,callback ){//代币转账
        try{
             web3.eth.getAccounts(async function(err,accounts){
                    let ethContract = new web3.eth.Contract(dss.contractABI,dss.contractAddr)
                    let fromAddr = accounts[0]
                    // console.log(accounts)
                  let value = web3.utils.toWei(amount,'ether');
                  await ethContract.methods.transfer(toAddress,value).send({from: fromAddr}).on(dss.txResp.transactionHash, function(hash){
                    if(dss.debug){
                        console.log("txhash:"+hash,"sumbit payment")
                    }
                    callback(dss.txResp.transactionHash,hash)
                }).on(dss.txResp.receipt, function(receipt){
                    if(dss.debug){
                        console.log(receipt,"complete payment")
                    }
                    callback(dss.txResp.receipt,receipt)
                    // }).on('confirmation', function(confirmationNumber, receipt){
                    //     if(dss.debug){
                    //         console.log(confirmationNumber,"confirmation payment")
                    //     }
                }).on(dss.txResp.error, function(result){
                    console.log(result)
                    callback(dss.txResp.error,result)
                });

            });

        }catch (error) { // If a out of gas error, the second parameter is the receipt.
            console.log("error==>"+error)
        }

    },

    getAccount:async function (callback) {
        try {
            let accounts = await web3.eth.getAccounts();
            dss.account = accounts[0];
            let balance = await web3.eth.getBalance(dss.account);
            dss.balance = web3.utils.fromWei(balance, 'ether');
        }catch (error) {
            console.log("error==>"+error)
        }

        if(callback!== 'undefined'){
            callback(dss.account,dss.balance)
        }
    },

    getRobinTokenAccount:async function (callback) {//ROB account
        let contractABI =[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
        let contractAddr = "0x89d91cE6c62C01a6F164640199C9A7242d16b33f"
        dss.contractInit(contractABI,contractAddr)
        dss.getTokenAccount(callback)
    },
    getlpRobTokenAccount:async function (callback) {//LP-ROB account
        let contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
        let contractAddr = "0xbbA2b6E596aA86bF9f34CBEb3B48805654D38ee0"
        dss.contractInit(contractABI,contractAddr)
        dss.getTokenAccount(callback)
    },

    getTokenAccount:async function (callback) {
        try {
            let accounts = await web3.eth.getAccounts();
            dss.account = accounts[0];
            let ethContract = new web3.eth.Contract(dss.contractABI,dss.contractAddr)
            let balance = await ethContract.methods.balanceOf(dss.account).call({from:dss.account})
            dss.balance = web3.utils.fromWei(balance, 'ether');
            if(callback!== 'undefined'){
                callback(dss.account,dss.balance)
            }
            // ethContract.methods.name().call({from:dss.account},(err,result)=>{
            //     console.log(result)
            //
            // })
            // ethContract.methods.symbol().call({from:dss.account},(err,result)=>{
            //     console.log(result)
            //
            // })
            // ethContract.methods.totalSupply().call({from:dss.account},(err,result)=>{
            //     console.log(result)
            //
            // })

        }catch (error) {
            console.log("error==>"+error)
        }


    },
    chainAdd: async function(chainId,chainName,currencyName,currencySymbol,currencyDecimals,rpcUrls,blockExplorerUrls){
        window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
                chainId: web3.utils.toHex(chainId),
                chainName: chainName,
                nativeCurrency: {
                    name: currencyName,
                    symbol: currencySymbol,
                    decimals: currencyDecimals
                },
                rpcUrls: rpcUrls,
                blockExplorerUrls: blockExplorerUrls
            }]
        })
            .catch((error) => {
                console.log(error)
            })
    },
    tokenAdd:async function(tokenAddress,tokenSymbol,tokenDecimals,tokenImage){
        // const tokenAddress = '0xd00981105e61274c8a5cd5a88fe7e037d935b513';
        // const tokenSymbol = 'TUT';
        // const tokenDecimals = 18;
        // const tokenImage = 'http://placekitten.com/200/300';

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20', // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            });

            if (wasAdded) {
                console.log('Thanks for your interest!');
            } else {
                console.log('Your loss!');
            }
        } catch (error) {
            console.log(error);
        }
    },
    switchChain: async function(chainId){
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: web3.utils.toHex(chainId) }],
            });
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            // if (switchError.code === 4902) {
            //     try {
            //         await ethereum.request({
            //             method: 'wallet_addEthereumChain',
            //             params: [{ chainId: '0xf00', rpcUrl: 'https://...' /* ... */ }],
            //         });
            //     } catch (addError) {
            //         // handle "add" error
            //     }
            // }
            // handle other "switch" errors
            console.log('error=>'+switchError)
        }
    },
    checkAddr: function(address){
        return web3.utils.isAddress(address)
    },
    getChainId: async  function(){
        return await web3.eth.net.getId();
    }
}




// 通过私以太币转账
async function paymentByPriKey(toAddr,value,priKey){

    let currentAccount =  await web3.eth.getAccounts()[0];
    // 先获取当前账号交易的nonce
    let nonce = await web3.eth.getTransactionCount(currentAccount, web3.eth.defaultBlock.pending);
        // 获取交易数据
        var txData = {
            // nonce每次++，以免覆盖之前pending中的交易
            nonce: web3.utils.toHex(nonce++),
            // 设置gasLimit和gasPrice
            gasLimit: web3.utils.toHex(99000),
            gasPrice: web3.utils.toHex(10e9),
            // 要转账的哪个账号
            to: toAddr,
            // 从哪个账号转
            from: currentAccount,
            value: web3.utils.toWei(value,'ether'),
            data: ''
        }

        var tx = new ethereumjs(txData);

        // 引入私钥，并转换为16进制
        const privateKey = new Buffer(priKey, 'hex');

        // 用私钥签署交易
        tx.sign(privateKey);

        // 序列化
        var serializedTx = tx.serialize().toString('hex');

        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
            if (!err) {
                console.log(hash);
            } else {
                console.error(err);
            }
        });


}

//代币转账
async function tokenPaymentByPrivatekey(contractAddr,toAddr,value,priKey){
    // 先获取当前账号交易的nonce
    let currentAccount =  await web3.eth.getAccounts()[0];
    let nonce = await web3.eth.getTransactionCount(currentAccount, web3.eth.defaultBlock.pending);
        // 获取交易数据
        var txData = {
            nonce: web3.utils.toHex(nonce++),
            gasLimit: web3.utils.toHex(99000),
            gasPrice: web3.utils.toHex(10e9),
            // 注意这里是代币合约地址
            to: contractAddr,
            from: currentAccount,
            // 调用合约转账value这里留空
            value: '0x00',
            // data的组成，由：0x + 要调用的合约方法的function signature + 要传递的方法参数，每个参数都为64位(对transfer来说，第一个是接收人的地址去掉0x，第二个是代币数量的16进制表示，去掉前面0x，然后补齐为64位)
            data: '0x' + 'a9059cbb' + addPreZero(toAddr.substr(2)) + addPreZero(web3.utils.toHex(web3.utils.toWei(value,'ether')).substr(2))
        }

        var tx = new ethereumjs(txData);

        const privateKey = new Buffer(priKey, 'hex');

        tx.sign(privateKey);

        var serializedTx = tx.serialize().toString('hex');

        web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
            if (!err) {
                console.log(hash);
            } else {
                console.error(err);
            }


    });

    // 补齐64位，不够前面用0补齐
    function addPreZero(num){
        var t = (num+'').length,
            s = '';
        for(var i=0; i<64-t; i++){
            s += '0';
        }
        return s+num;
    }

}




