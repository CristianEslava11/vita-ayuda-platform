export interface PaginationParams {
  page: number;
  limit: number;
}
export function paginationToPrisma({ page, limit }: PaginationParams): { skip: number; take: number } {
  if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
    throw new Error('La pagina y el limite deben ser enteros positivos.');
  }
  return { skip: (page - 1) * limit, take: limit };
}
