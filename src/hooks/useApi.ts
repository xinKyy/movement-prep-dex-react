import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService} from '../services/api';

// 获取所有市场
export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => apiService.getMarkets(),
    refetchInterval: 30000, // 30秒刷新
    staleTime: 10000,
  });
}

// 获取市场详情
export function useMarket(id: number) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: () => apiService.getMarket(id),
    enabled: id >= 0,
    refetchInterval: 10000,
  });
}

// 获取价格
export function usePrices(marketId?: number, limit = 10) {
  return useQuery({
    queryKey: ['prices', marketId, limit],
    queryFn: () => apiService.getPrices(marketId, limit),
    refetchInterval: 3000, // 3秒刷新
    staleTime: 1000,
  });
}

// 获取用户持仓
export function usePositions(
  userAddr?: string | undefined, 
  status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED',
  statuses?: ('OPEN' | 'CLOSED' | 'LIQUIDATED')[]
) {
  return useQuery({
    queryKey: ['positions', userAddr, status, statuses],
    queryFn: () => apiService.getPositions({ user: userAddr, status, statuses }),
    enabled: !!userAddr,
    refetchInterval: 5000, // 5秒刷新
    staleTime: 2000,
  });
}

// 获取持仓详情
export function usePosition(id: string | undefined) {
  return useQuery({
    queryKey: ['position', id],
    queryFn: () => apiService.getPosition(id!),
    enabled: !!id,
    refetchInterval: 3000,
  });
}

// 开仓 mutation
export function useOpenPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      userAddr: string;
      marketId: number;
      side: 'LONG' | 'SHORT';
      margin: number;
      leverage: number;
      acceptablePrice?: number;
    }) => apiService.createOpenOrder(params),
    onSuccess: () => {
      // 刷新持仓列表
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

// 平仓 mutation
export function useClosePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      positionId: string;
      userAddr: string;
      minExitPrice?: number;
    }) => apiService.createCloseOrder(params),
    onSuccess: () => {
      // 刷新持仓列表
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
  });
}

// 检查价格是否过期
export function usePriceStaleness(marketId?: number) {
  return useQuery({
    queryKey: ['priceStaleness', marketId],
    queryFn: () => apiService.checkPriceStaleness(marketId!),
    enabled: marketId !== undefined,
    refetchInterval: 10000, // 10秒检查一次
    staleTime: 5000,
  });
}

// 刷新价格 mutation
export function useRefreshPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (marketId: number) => apiService.refreshPrice(marketId),
    onSuccess: (_, marketId) => {
      // 刷新价格和staleness查询
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['priceStaleness', marketId] });
    },
  });
}

// 格式化工具
export { apiService };

