import { API_CONFIG, PRECISION } from '../config/constants';

const { baseUrl } = API_CONFIG;

// API 错误类型
interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// API 响应类型
interface ApiResponse<T> {
  data: T;
  error: ApiError | string | null;
}

// 提取错误消息的辅助函数
function extractErrorMessage(error: ApiError | string | null): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  return error.message || error.code || 'Unknown error';
}

// 市场类型
export interface Market {
  id: number;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  maxLeverage: string;
  initMr: string;
  maintMr: string;
  feeRate: string;
  liqRewardRate: string;
  settlementTokenId: number;
  isActive: boolean;
  latestPrice?: {
    price: string;
    timestamp: string;
    source: string;
  };
}

// 持仓类型
export interface Position {
  id: string;
  chainId: string;
  chainPositionId?: string;
  userAddr: string;
  marketId: number;
  symbol: string;
  isLong: boolean;
  margin: string;
  leverage: string;
  notional: string;
  entryPrice: string;
  feesPaid: string;
  fundingPaid: string;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  healthFactor?: string;
  pnl?: string;
  marginRatio?: string;
  isLiquidatable?: boolean;
  currentPrice?: string;
  openedAt: string;
  closedAt: string | null;
}

// 价格类型
export interface Price {
  id: string;
  marketId: number;
  symbol: string;
  price: string;
  source: string;
  timestamp: string;
}

// 交易 payload 类型
export interface TxPayload {
  function: string;
  functionArguments: (string | number | boolean)[];
}

// 开仓响应
export interface OpenOrderResponse {
  message: string;
  txPayload: TxPayload;
  params: {
    userAddr: string;
    marketId: number;
    side: string;
    margin: string;
    leverage: string;
    currentPrice: string;
    acceptablePrice: string | null;
  };
}

// 平仓响应
export interface CloseOrderResponse {
  message: string;
  txPayload: TxPayload;
  params: {
    positionId: string;
    chainId: string;
    chainPositionId: string;
    marketId: number;
    currentPrice: string;
    estimatedPnl: string;
    estimatedPayout: string;
  };
}

// 价格新鲜度检查响应
export interface PriceStalenessResponse {
  marketId: number;
  isStale: boolean;
  chainPrice: {
    price: string;
    timestamp: string;
    ageSeconds: number | null;
  } | null;
  dbPrice: {
    price: string;
    timestamp: string;
    ageSeconds: number;
  } | null;
}

// 价格刷新响应
export interface PriceRefreshResponse {
  marketId: number;
  wasStale: boolean;
  isNowStale: boolean;
  txHash: string;
  success: boolean;
  newChainPrice: {
    price: string;
    timestamp: string;
  } | null;
}

// API 服务类
class ApiService {
  // 健康检查
  async healthCheck(): Promise<{ status: string }> {
    const res = await fetch(`${baseUrl}/health`);
    const { data } = await res.json();
    return data;
  }

  // 获取所有市场
  async getMarkets(): Promise<Market[]> {
    const res = await fetch(`${baseUrl}/markets`);
    const { data, error }: ApiResponse<Market[]> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 获取市场详情
  async getMarket(id: number): Promise<Market> {
    const res = await fetch(`${baseUrl}/markets/${id}`);
    const { data, error }: ApiResponse<Market> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 获取价格
  async getPrices(marketId?: number, limit = 10): Promise<Price[]> {
    const params = new URLSearchParams();
    if (marketId !== undefined) params.append('marketId', marketId.toString());
    params.append('limit', limit.toString());

    const res = await fetch(`${baseUrl}/prices?${params}`);
    const { data, error }: ApiResponse<Price[]> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 检查价格是否过期
  async checkPriceStaleness(marketId: number): Promise<PriceStalenessResponse> {
    const res = await fetch(`${baseUrl}/prices/staleness/${marketId}`);
    const { data, error }: ApiResponse<PriceStalenessResponse> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 刷新链上价格
  async refreshPrice(marketId: number): Promise<PriceRefreshResponse> {
    const res = await fetch(`${baseUrl}/prices/refresh/${marketId}`, {
      method: 'POST',
    });
    const { data, error }: ApiResponse<PriceRefreshResponse> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 获取持仓列表
  async getPositions(params: {
    user?: string;
    marketId?: number;
    status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
    limit?: number;
    offset?: number;
  } = {}): Promise<{ positions: Position[]; pagination: { total: number; limit: number; offset: number } }> {
    const searchParams = new URLSearchParams();
    if (params.user) searchParams.append('user', params.user);
    if (params.marketId !== undefined) searchParams.append('marketId', params.marketId.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    
    const res = await fetch(`${baseUrl}/positions?${searchParams}`);
    const { data, error } = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 获取持仓详情
  async getPosition(id: string): Promise<Position> {
    const res = await fetch(`${baseUrl}/positions/${id}`);
    const { data, error }: ApiResponse<Position> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 创建开仓订单
  async createOpenOrder(params: {
    userAddr: string;
    marketId: number;
    side: 'LONG' | 'SHORT';
    margin: number;
    leverage: number;
    acceptablePrice?: number;
  }): Promise<OpenOrderResponse> {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const { data, error }: ApiResponse<OpenOrderResponse> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 创建平仓订单
  async createCloseOrder(params: {
    positionId: string;
    userAddr: string;
    minExitPrice?: number;
  }): Promise<CloseOrderResponse> {
    const res = await fetch(`${baseUrl}/orders/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const { data, error }: ApiResponse<CloseOrderResponse> = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 同步仓位到数据库
  async syncPosition(params: {
    txHash: string;
    userAddr: string;
    marketId: number;
    isLong: boolean;
    margin: number;
    leverage: number;
    entryPrice: number;
  }): Promise<{ id: string; chainId: string; message: string; isNew: boolean }> {
    const res = await fetch(`${baseUrl}/positions/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const { data, error } = await res.json();
    if (error) throw new Error(extractErrorMessage(error));
    return data;
  }

  // 格式化市场数据
  formatMarket(market: Market) {
    return {
      ...market,
      maxLeverageNum: Number(market.maxLeverage) / PRECISION,
      feeRateNum: Number(market.feeRate) / PRECISION,
      initMrNum: Number(market.initMr) / PRECISION,
      maintMrNum: Number(market.maintMr) / PRECISION,
      latestPriceNum: market.latestPrice ? Number(market.latestPrice.price) / PRECISION : null,
    };
  }

  // 格式化持仓数据
  formatPosition(position: Position) {
    return {
      ...position,
      marginNum: Number(position.margin) / PRECISION,
      leverageNum: Number(position.leverage) / PRECISION,
      notionalNum: Number(position.notional) / PRECISION,
      entryPriceNum: Number(position.entryPrice) / PRECISION,
      pnlNum: position.pnl ? Number(position.pnl) / PRECISION : null,
      currentPriceNum: position.currentPrice ? Number(position.currentPrice) / PRECISION : null,
      healthFactorNum: position.healthFactor ? Number(position.healthFactor) : null,
    };
  }
}

export const apiService = new ApiService();

