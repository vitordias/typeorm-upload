import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, getCustomRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import Transaction from '../models/Transaction';

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transactionsReadStream = fs.createReadStream(filePath);
    const parser = csvParse({
      from_line: 2,
    });

    const parseCSV = transactionsReadStream.pipe(parser);

    const transactions: TransactionDTO[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value || !category) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });
    // Promisse para esperar o parse
    await new Promise(resolve => parseCSV.on('end', resolve));
    const existsCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });
    // Retorna as categorias que já existem
    const existsCategoriesTitles = existsCategories.map(
      (category: Category) => category.title,
    );
    // Retorna as categorias que ainda não existem, removendo duplicados
    const addCategoriesTitles = categories
      .filter(category => !existsCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...existsCategories, ...newCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category_id: allCategories.find(
          category => category.title === transaction.category,
        )?.id,
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
