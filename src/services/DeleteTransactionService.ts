import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactionToRemove = await transactionsRepository.findOne(id);

    if (transactionToRemove) {
      await transactionsRepository.remove(transactionToRemove);
    } else {
      throw new AppError('Transaction not found', 401);
    }
  }
}

export default DeleteTransactionService;
