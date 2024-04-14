import { WalletContractV3R2, TonClient, internal, SendMode, Cell, Address, beginCell, toNano, OpenedContract, contractAddress, loadStateInit } from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";

// 上架NFT
async function nftSale(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const walletAddr = wallet.address;
    const nftAddress = Address.parseFriendly("kQCulKI6HcpeXGsjChdCJv6uK-yNCkzB-Uxp71k9YpKfXziA");

    // const nftData = await client.runMethod(nftAddress.address, "get_nft_data", []);
    // console.log("nftData = ", nftData);

    const nftOwner = walletAddr;

    const newOwner = Address.parseFriendly("kQCEYvktUqxfIfQAoy1t6FbdmMI_XElnAiNsWxEiEWV04Uuj");
    const marketplace_fee_address = Address.parseFriendly("UQAOz5mN-01IfUIA29cWBvy-4Fc8wJkKHHE0IYzhCKrY4dle");
    const marketplace_address = Address.parseFriendly("kQARKOWkrwl7nyhOq7D8cKcHgCG_Q7kqpQnQmRB3IAc0PO29");
    const fullPrice = toNano("0.1");
    const marketplace_fee = toNano("0.01");
    const now = 1713071211; // Math.floor(Date.now() / 1000);

    const saleCode = Cell.fromBase64("te6cckECCwEAArkAART_APSkE_S88sgLAQIBIAIDAgFIBAUAfvIw7UTQ0wDTH_pA-kD6QPoA1NMAMMABjh34AHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVOBfB4IA__7y8AICzAYHAFegOFnaiaGmAaY_9IH0gfSB9AGppgBgYaH0gfQB9IH0AGEEIIySsKAVgAKrAQH32A6GmBgLjYSS-CcH0gGHaiaGmAaY_9IH0gfSB9AGppgBgYOCmE44BgAEqYhOmPhW8Q4YBKGATpn8cIxbMbC3MbK2QV44LJOZlvKAVxFWAAyS-G8BJrpOEBFcCBFd0VYACRWdjYKdxjgthOjq-G6hhoaYPqGAD9gHAU4ADAgB97UEIHc1lACkwUCkYX3lw4RJofSB9AH0gfQAYKclQkNCoQ9CLUClIOEAIZGWCqAHniwD9AWW1ZLj9gBLhABLrpOEBWEcLqCK4QAhkZYKoAeeLAP0BZbVkuP2ACBHJGhpxLThACGRlgqgB54sA_QFltWS4_YA4EEEIL-YeikKAejy0ZSzjkIxMzk5U1LHBZJfCeBRUccF8uH0ghAFE42RFrry4fUD-kAwRlAQNFlwB8jLABbLH1AEzxZYzxYBzxYB-gLMywDJ7VTgMDcowAPjAijAAJw2NxA4R2UUQzBw8ArgCMACmFVEECQQI_AK4F8KhA_y8AkA1Dg5ghA7msoAGL7y4clTRscFUVLHBRWx8uHKcCCCEF_MPRQhgBDIywUozxYh-gLLassfFcs_J88WJ88WFMoAI_oCE8oAyYMG-wBxUGZFFQRwB8jLABbLH1AEzxZYzxYBzxYB-gLMywDJ7VQAlsjLHxPLPyPPFlADzxbKAIIJycOA-gLKAMlxgBjIywUmzxZw-gLLaszJgwb7AHFVUHAHyMsAFssfUATPFljPFgHPFgH6AszLAMntVI5LSB0=");

    const saleStateInit = beginCell()
        .storeUint(0, 2) // no split depth; no Ticktock
        .storeUint(1, 1)
        .storeRef(saleCode) // code
        .storeUint(1, 1)
        .storeRef(beginCell()
            .storeUint(0, 1)  // is_complete
            .storeUint(now, 32)  // created_at
            .storeAddress(marketplace_address.address)  // marketplace_address
            .storeAddress(nftAddress.address)  // nft_address
            .storeAddress(nftOwner)  // nft_owner_address
            .storeCoins(fullPrice)  // full_price
            .storeRef(beginCell()
                .storeAddress(marketplace_fee_address.address) // marketplace_fee_address
                .storeCoins(marketplace_fee) // marketplace_fee
                .storeUint(0, 2) // royalty_address
                .storeCoins(0) // royalty_amount
            )  // fees_cell
            .storeUint(0, 1)  // can_deploy_by_external
        )
        .storeUint(0, 1);

    const saleContractAddress = contractAddress(0, loadStateInit(saleStateInit.endCell().beginParse()))
    console.log("saleContractAddress = ", saleContractAddress); // kQB4E5x-GRYSO-k6fzS9M0irICO1umspoH3uA9zVRtVrY22h

    const saleMsgBody = beginCell()
        .storeUint(1, 32) // just accept coins
        .storeUint(0, 64); // query_id

    const payload = beginCell()
        .storeUint(0x5fcc3d14, 32) // transfer
        .storeUint(0, 64) // query_id
        .storeAddress(newOwner.address) // new_owner_address
        .storeAddress(walletAddr) // response_destination
        .storeUint(0, 1) // this nft don't use custom_
        .storeCoins(toNano("0.1")) // forward_amount
        .storeUint(0x00fe0ede, 32)
        .storeRef(saleStateInit)
        .storeRef(saleMsgBody);


    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: nftAddress.address,
                value: "1",
                body: payload.endCell()
            })
        ],
    });
}

// 购买NFT
async function saleBuy(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const saleContractAddress = Address.parseFriendly("kQB4E5x-GRYSO-k6fzS9M0irICO1umspoH3uA9zVRtVrY22h");

    const payload = beginCell()
        .storeUint(2, 32) // buy
        .storeUint(0, 64) // query_id

    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: saleContractAddress.address,
                value: "2",
                body: payload.endCell()
            })
        ],
    });

}

// 下架NFT
async function saleCancel(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const saleContractAddress = Address.parseFriendly("kQB4E5x-GRYSO-k6fzS9M0irICO1umspoH3uA9zVRtVrY22h");

    const payload = beginCell()
        .storeUint(3, 32) // cancel
        .storeUint(0, 64) // query_id

    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: saleContractAddress.address,
                value: "2",
                body: payload.endCell()
            })
        ],
    });

}

// 拍卖NFT
async function nftAuction(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const walletAddr = wallet.address;
    const nftAddress = Address.parseFriendly("kQAhSV0VvHPGWMKafhzmYfJClQt-OThJwpvuBUNNaF0lfXRF");

    // const nftData = await client.runMethod(nftAddress.address, "get_nft_data", []);
    // console.log("nftData = ", nftData);

    const nftOwner = walletAddr;

    const newOwner = Address.parseFriendly("kQCEYvktUqxfIfQAoy1t6FbdmMI_XElnAiNsWxEiEWV04Uuj");
    const marketplace_fee_address = Address.parseFriendly("UQAOz5mN-01IfUIA29cWBvy-4Fc8wJkKHHE0IYzhCKrY4dle");
    const marketplace_address = Address.parseFriendly("kQARKOWkrwl7nyhOq7D8cKcHgCG_Q7kqpQnQmRB3IAc0PO29");

    const now = 1713074873; // Math.floor(Date.now() / 1000);

    const auctionCode = Cell.fromBase64("te6cckECHAEABZcAART_APSkE_S88sgLAQIBIAIDAgFIBAUELPLbPPhEwACOiDD4AH_4ZNs84Ns8wAIUGxUWAgLMBgcCi6A4WbZ5tnkEEIKqh_CF8KHwh_Cn8KXwnfCb8Jnwl_CV8Ivwn_CMGiImGhgiJBgWIiIWFCIgFCE-IRwg-iDYILYg9CDSILEUGQIBIAgJAB3ZBgAEmvgbhwLPgDgPgDQE9dAOhpgYC42HkgfSAYbZ58IWB__CGpEGOC2EdoGZjpj5DgAEaCTkyuDKwui-ytzIvsLqxujS3t0CkQY4LYR0Gt7Z5wGWAARoIsrayuTOytzG8r7ayubmws7LApEGOC2E1qGGhpg-oYAP2AcBhwfCmpCGOCx0IZmO2ecADBQXCgsCAVgSEwFcMYED6fhS10nCAvLygQPqAdMfghAFE42REroS8vSAQNch-kAw-HJw-GJ_-GTbPBsE6Ns8IMABjr0wMoED7fgj-FC-8vKBA-34QsD_8vKBA_ABghA7msoAufLygQPx-E7CAPLy-FJSEMcF-ENSIMcFsfLhk9s84CDAAuMCwAOSXwPg-ELA__gj-FC-sZdfA4ED7fLw4PhLghA7msoAoFIgvvhLwgCwFRgMDQF2MDKBA-34QsD_8vKBA_ABghA7msoAufLygQPy-CP4ULny8vhSUhDHBfhDUiDHBbH4TVIgxwWx8uGT2zwXBM6PFgJw2zwh-G2CEDuaygCh-G74I_hv2zzg-FD4UaH4I7mX-FD4UaD4cN74To6VMoED6PhKUiC58vL4bvht-CP4b9s84fhOghAF9eEAoPhO-EymZIBk8Ai2CVIguZdfA4ED6PLw4AJwDxcbDgIa2zwB-G34bvgj-G_bPA8bAvL4TsEBkVvg-E74R6EiggiYloChUhC8mTABggiYloChAZEy4o0KVlvdXIgYmlkIGhhcyBiZWVuIG91dGJpZCBieSBhbm90aGVyIHVzZXIugAcD_jh8wjQbQXVjdGlvbiBoYXMgYmVlbiBjYW5jZWxsZWQug3iHCAOMPEBEAOHAggBjIywX4Tc8WUAT6AhPLahLLHwHPFsly-wAAAlsAEyCEDuaygABqYSAAESCEDuaygCphIADK-EFu3e1E0NIAAfhi0gAB-GTSAAH4ZvpAAfht-gAB-G7THwH4b9MfAfhw-kAB-HLUAfho1DD4afhJ0NIfAfhn-kAB-GP6AAH4avoAAfhr-gAB-GzTHwH4cfpAAfhz0x8w-GV_-GEAjCDHAMD_kjBw4NMfMYtmNhbmNlbIIccFkjBx4ItHN0b3CCHHBZIwcuCLZmaW5pc2iCHHBZIwcuCLZkZXBsb3mAHHBZFz4HABZI6rgQPt-ELA__LygQPy-CP4ULny8vgnbyIwgQPwAYIQO5rKALny8vgA-FLbPOCED_LwFwP2-E7AAI6C2zzg2zz4TkBU8AggwgCOK3AggBDIywVQB88WIvoCFstqFcsfi_TWFya2V0cGxhY2UgZmVljPFsly-wCRNOL4TkAD8AggwgCOI3AggBDIywVQBM8WIvoCE8tqEssfi3Um95YWx0eYzxbJcvsAkTHigggPQkBwGBkaAYpwIPglghBfzD0UyMsfyz_4Us8WUAPPFhLLACH6AssAyXGAGMjLBfhTzxZw-gLLasyCCA9CQHD7AsmDBvsAf_hif_hm2zwbACD4SND6QNMf0x_6QNMf0x8wAeD7AvhOWKEBoSDCAI4icCCAEMjLBfhSzxZQA_oCEstqyx-LZQcm9maXSM8WyXL7AJEw4nAg-CWCEF_MPRTIyx_LP_hNzxZQA88WEssAggiYloD6AssAyXGAGMjLBfhTzxZw-gLLaszJgwb7AH_4Yts8GwBU-En4SPhQ-E_4RvhE-ELIygDKAMoA-E3PFvhO-gLLH8sf-FLPFszMye1UbeIQ5g==");

    const auctionStateInit = beginCell()
        .storeUint(0, 2) // no split depth; no Ticktock
        .storeUint(1, 1)
        .storeRef(auctionCode)
        .storeUint(1, 1)
        .storeRef(beginCell()
            .storeInt(0n, 1) // end?
            .storeInt(-1n, 1) // activated?
            .storeInt(0n, 1) // is_canceled?
            .storeUint(0, 2) // last_member
            .storeCoins(0) // last_bid
            .storeUint(0, 32) // last_bid_at
            .storeUint(now + 7200, 32) // end_time
            .storeAddress(nftOwner) // nft_owner
            .storeRef(beginCell()
                .storeAddress(marketplace_fee_address.address) // mp_fee_addr
                .storeUint(50, 32) // mp_fee_factor
                .storeUint(1000, 32) // mp_fee_base
                .storeUint(0, 2) // royalty_fee_addr
                .storeUint(0, 32) // royalty_fee_factor
                .storeUint(0, 32) // royalty_fee_base
            )
            .storeRef(beginCell()
                .storeInt(9909000, 32) // sub_gas_price_from_bid?
                .storeAddress(marketplace_address.address) // mp_addr
                .storeCoins(toNano("0.1")) // min_bid
                .storeCoins(toNano("0.9")) // max_bid
                .storeCoins(toNano("0.1")) // min_step
                .storeUint(30, 32) // step_time
                .storeAddress(nftAddress.address) // nft_addr
                .storeUint(now, 32) // created_at?
            )
        )
        .storeUint(0, 1)

    const auctionContractAddress = contractAddress(0, loadStateInit(auctionStateInit.endCell().beginParse()))
    console.log("auctionContractAddress = ", auctionContractAddress); // kQDwxp1ZRsWXxPlC8ZNN-xd7tsOgSwh3cFEhLt_iX8TLc4DD

    const auctionMsgBody = beginCell()
        .storeUint(0, 32) // op
        .storeStringTail("deploy"); // just accept coins

    const payload = beginCell()
        .storeUint(0x5fcc3d14, 32) // transfer
        .storeUint(0, 64) // query_id
        .storeAddress(newOwner.address) // new_owner_address
        .storeAddress(walletAddr) // response_destination
        .storeUint(0, 1) // this nft don't use custom_
        .storeCoins(toNano("0.1")) // forward_amount
        .storeUint(0x00fe0ede, 32)
        .storeRef(auctionStateInit)
        .storeRef(auctionMsgBody);


    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: nftAddress.address,
                value: "1",
                body: payload.endCell()
            })
        ],
    });
}

// 竞价
async function auctionBid(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const auctionContractAddress = Address.parseFriendly("kQDwxp1ZRsWXxPlC8ZNN-xd7tsOgSwh3cFEhLt_iX8TLc4DD");

    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: auctionContractAddress.address,
                value: "1",
                body: "bid"
            })
        ],
    });
}

// 取消竞拍
async function auctionCancel(wallet: OpenedContract<WalletContractV3R2>, kp: KeyPair, seqno: number) {
    const auctionContractAddress = Address.parseFriendly("kQDwxp1ZRsWXxPlC8ZNN-xd7tsOgSwh3cFEhLt_iX8TLc4DD");

    const payload = beginCell()
        .storeUint(0, 32) // op
        .storeStringTail("stop"); // finish

    return wallet.createTransfer({
        secretKey: kp.secretKey,
        seqno,
        sendMode: SendMode.PAY_GAS_SEPARATELY | SendMode.IGNORE_ERRORS,
        messages: [
            internal({
                to: auctionContractAddress.address,
                value: "1",
                body: payload.endCell()
            })
        ],
    });
}

(async () => {
    const kp = await mnemonicToPrivateKey(["xxx","xxx"]);
    console.log("wallet public key = ", kp.publicKey.toString('hex'));


    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC?api_key=ecda11db898298352344b2df858e2ac02f2163053f92b1494e626e715b7c7190',
    });


    const wallet = client.open(WalletContractV3R2.create({ workchain: 0, publicKey: kp.publicKey }));

    const seqno = await wallet.getSeqno();
    console.log("seqno = ", seqno);

    const balance = await wallet.getBalance();
    console.log("balance = ", balance);

    // 上架NFT
    const sale = await nftSale(wallet, kp, seqno);
    console.log("sale = ", sale);

    // 拍卖NFT
    const auction = await nftAuction(wallet, kp, seqno);
    console.log("auction = ", auction);

})();

