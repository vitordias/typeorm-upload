import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  type: 'income' | 'outcome';
  value: number;
  title: string;
  category: string;
}

class CreateTransactionService {
  public async execute({
    type,
    value,
    title,
    category,
  }: Request): Promise<Transaction> {
    // Apenas para consulta
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = transactionsRepository.getBalance();

    switch (type) {
      case 'income':
        break;
      case 'outcome':
        if ((await balance).total - value < 0) {
          throw new AppError('string');
        }
        break;
      default:
        throw new AppError('This type is incorrect');
    }

    // Validando Categoria
    const categoriesRepository = getRepository(Category);

    let transactionCategory = await categoriesRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      type,
      value,
      title,
      category_id: transactionCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
