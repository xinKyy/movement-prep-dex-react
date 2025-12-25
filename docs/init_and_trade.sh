#!/bin/bash

# Perps 合约初始化和交易脚本
# 从部署到下单的完整流程

set -e

# ========== 配置 ==========
# 从环境变量读取，或使用默认值
MODULE_ADDRESS="${MODULE_ADDRESS:-0xaecb1ba8583822e09f3ec40eecf28bcea3bbcf4b7b77728efd997108c87637aa}"
USER_ADDRESS="${USER_ADDRESS:-$MODULE_ADDRESS}"

# 精度常量
PRECISION=100000000

# 价格配置
BTC_PRICE=$((50000 * PRECISION))       # BTC = 50000 USD
ETH_PRICE=$((3000 * PRECISION))        # ETH = 3000 USD
BTC_LIQUIDATION_PRICE=$((40000 * PRECISION))  # BTC 清算价格 (下跌 20%)
ETH_LIQUIDATION_PRICE=$((3600 * PRECISION))   # ETH 清算价格 (上涨 20%)

# 金额配置
LP_DEPOSIT=$((1000 * PRECISION))       # LP 存入 1000 FUSD
USER_MINT=$((10000 * PRECISION))       # 给用户 mint 10000 FUSD
TRADE_MARGIN=$((100 * PRECISION))      # 交易保证金 100 FUSD
TRADE_LEVERAGE=$((10 * PRECISION))     # 10x 杠杆 (in fixed point)

# 清算者地址 (可以是任何地址，这里用 MODULE_ADDRESS)
LIQUIDATOR_ADDRESS="${LIQUIDATOR_ADDRESS:-$MODULE_ADDRESS}"

# 市场配置
MAX_LEVERAGE=$((100 * PRECISION))                   # 最大 100x 杠杆 (in fixed point)
INIT_MR=$((PRECISION / 100))                        # 1% 初始保证金率
MAINT_MR=$((PRECISION / 200))                       # 0.5% 维持保证金率
FEE_RATE=$((PRECISION / 1000))                      # 0.1% 手续费
LIQ_REWARD_RATE=$((PRECISION / 200))                # 0.5% 清算奖励

# ========== 辅助函数 ==========
log() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

run_tx() {
    echo "执行: $1"
    eval "$1"
    echo "✓ 完成"
    echo ""
}

# ========== 主流程 ==========

log "1. 部署合约"
run_tx "m move publish --named-addresses perps=${MODULE_ADDRESS} --assume-yes"

log "2. 初始化 Perps 系统"
run_tx "m move run --function-id ${MODULE_ADDRESS}::perps::initialize_entry --assume-yes"

log "3. 初始化 Mock FUSD"
run_tx "m move run --function-id ${MODULE_ADDRESS}::mock_fusd::initialize --assume-yes"

log "4. 注册 BTC/USD 市场 (market_id=0)"
# symbol: BTC/USD (hex: 4254432f555344)
# base_asset: BTC (hex: 425443)
# quote_asset: USD (hex: 555344)
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::register_market_entry \
    --args 'hex:4254432f555344' 'hex:425443' 'hex:555344' \
           'u64:${MAX_LEVERAGE}' 'u64:${INIT_MR}' 'u64:${MAINT_MR}' \
           'u64:${FEE_RATE}' 'u64:${LIQ_REWARD_RATE}' 'u64:${BTC_PRICE}' 'u64:0' \
    --assume-yes"

log "5. 注册 ETH/USD 市场 (market_id=1)"
# symbol: ETH/USD (hex: 4554482f555344)
# base_asset: ETH (hex: 455448)
# quote_asset: USD (hex: 555344)
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::register_market_entry \
    --args 'hex:4554482f555344' 'hex:455448' 'hex:555344' \
           'u64:${MAX_LEVERAGE}' 'u64:${INIT_MR}' 'u64:${MAINT_MR}' \
           'u64:${FEE_RATE}' 'u64:${LIQ_REWARD_RATE}' 'u64:${ETH_PRICE}' 'u64:0' \
    --assume-yes"

log "6. 给用户 Mint Mock FUSD"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::mock_fusd::mint \
    --args 'address:${USER_ADDRESS}' 'u64:${USER_MINT}' \
    --assume-yes"

log "7. LP 存款到 BTC 市场 Vault (market_id=0)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::deposit_entry \
    --args 'u64:0' 'u64:${LP_DEPOSIT}' \
    --assume-yes"

log "8. LP 存款到 ETH 市场 Vault (market_id=1)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::deposit_entry \
    --args 'u64:1' 'u64:${LP_DEPOSIT}' \
    --assume-yes"

log "9. 更新 BTC 价格"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::update_price_entry \
    --args 'address:${MODULE_ADDRESS}' 'u64:0' 'u64:${BTC_PRICE}' \
    --assume-yes"

log "10. 更新 ETH 价格"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::update_price_entry \
    --args 'address:${MODULE_ADDRESS}' 'u64:1' 'u64:${ETH_PRICE}' \
    --assume-yes"

log "11. 开仓 - 做多 BTC (market_id=0, position_id=0)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::open_position_entry \
    --args 'u64:0' 'bool:true' 'u64:${TRADE_MARGIN}' 'u64:${TRADE_LEVERAGE}' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "12. 开仓 - 做空 ETH (market_id=1, position_id=0)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::open_position_entry \
    --args 'u64:1' 'bool:false' 'u64:${TRADE_MARGIN}' 'u64:${TRADE_LEVERAGE}' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "13. 平仓 - BTC 仓位 (market_id=0, position_id=0)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::close_position_by_trader_entry \
    --args 'u64:0' 'u64:0' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "14. 平仓 - ETH 仓位 (market_id=1, position_id=0)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::close_position_by_trader_entry \
    --args 'u64:1' 'u64:0' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

# ========== 清算演示 ==========

log "15. 开仓 - 做多 BTC 用于清算测试 (market_id=0, position_id=1)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::open_position_entry \
    --args 'u64:0' 'bool:true' 'u64:${TRADE_MARGIN}' 'u64:${TRADE_LEVERAGE}' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "16. 开仓 - 做空 ETH 用于清算测试 (market_id=1, position_id=1)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::open_position_entry \
    --args 'u64:1' 'bool:false' 'u64:${TRADE_MARGIN}' 'u64:${TRADE_LEVERAGE}' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "17. 更新 BTC 价格触发清算 (下跌到 ${BTC_LIQUIDATION_PRICE})"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::update_price_entry \
    --args 'address:${MODULE_ADDRESS}' 'u64:0' 'u64:${BTC_LIQUIDATION_PRICE}' \
    --assume-yes"

log "18. 更新 ETH 价格触发清算 (上涨到 ${ETH_LIQUIDATION_PRICE})"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::update_price_entry \
    --args 'address:${MODULE_ADDRESS}' 'u64:1' 'u64:${ETH_LIQUIDATION_PRICE}' \
    --assume-yes"

log "19. 清算 BTC 多仓 (market_id=0, position_id=1)"
# 参数: liquidator_addr, trader_addr, market_id, position_id, admin_addr
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::liquidate_entry \
    --args 'address:${LIQUIDATOR_ADDRESS}' 'address:${USER_ADDRESS}' 'u64:0' 'u64:1' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "20. 清算 ETH 空仓 (market_id=1, position_id=1)"
run_tx "m move run \
    --function-id ${MODULE_ADDRESS}::perps::liquidate_entry \
    --args 'address:${LIQUIDATOR_ADDRESS}' 'address:${USER_ADDRESS}' 'u64:1' 'u64:1' 'address:${MODULE_ADDRESS}' \
    --assume-yes"

log "全部完成!"
echo ""
echo "摘要:"
echo "  - 合约地址: ${MODULE_ADDRESS}"
echo "  - 用户地址: ${USER_ADDRESS}"
echo "  - 清算者地址: ${LIQUIDATOR_ADDRESS}"
echo ""
echo "市场:"
echo "  - BTC/USD (market_id=0): $((BTC_PRICE / PRECISION)) USD"
echo "  - ETH/USD (market_id=1): $((ETH_PRICE / PRECISION)) USD"
echo ""
echo "交易:"
echo "  - 保证金: $((TRADE_MARGIN / PRECISION)) FUSD"
echo "  - 杠杆: ${TRADE_LEVERAGE}x"
echo "  - 仓位价值: $(((TRADE_MARGIN / PRECISION) * TRADE_LEVERAGE)) USD"
echo ""
echo "清算测试:"
echo "  - BTC 清算价格: $((BTC_LIQUIDATION_PRICE / PRECISION)) USD (多仓在价格下跌时被清算)"
echo "  - ETH 清算价格: $((ETH_LIQUIDATION_PRICE / PRECISION)) USD (空仓在价格上涨时被清算)"
echo ""
