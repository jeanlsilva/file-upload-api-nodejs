import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  filePath: string;
}

interface Transaction {
  title: string;
  value: string;
  type: 'income' | 'outcome';
  category: string;
}

interface TransactionsAndCategories {
  transactions: Transaction[];
  categories: string[];
}

class ImportTransactionsService {
  async execute({ filePath }: Request): Promise<TransactionsAndCategories> {
    const readCSVStream = fs.createReadStream(filePath);

    const parseStream = csvParse({
      from_line: 2,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: Transaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const addCategoryTitles: string[] = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const allCategories: string[] = [
      ...addCategoryTitles,
      ...existentCategoriesTitles,
    ];

    allCategories.forEach(async categoryTitle => {
      const category = await transactionsRepository.verifyCategory(
        categoryTitle,
      );

      transactions.forEach(async transaction => {
        if (transaction.category === categoryTitle) {
          const t = transactionsRepository.create({
            title: transaction.title,
            value: transaction.value,
            type: transaction.type,
            category,
          });

          await transactionsRepository.save(t);
        }
      });
    });

    console.log(await categoriesRepository.find());

    // const newCategories = categoriesRepository.create(
    //   addCategoryTitles.map(title => ({
    //     title,
    //   })),
    // );

    // await categoriesRepository.save(newCategories);

    // const finalCategories = [...newCategories, ...existentCategories];

    // const importedTransactions = transactionsRepository.create(
    //   transactions.map(transaction => ({
    //     title: transaction.title,
    //     value: transaction.value,
    //     type: transaction.type,
    //     category: finalCategories.find(
    //       category => category.title === transaction.category,
    //     ),
    //   })),
    // );

    // await transactionsRepository.save(importedTransactions);

    // console.log(await categoriesRepository.find());

    const transactionsAndCategories = {
      transactions,
      categories: addCategoryTitles,
    };

    return transactionsAndCategories;
  }
}

export default ImportTransactionsService;
