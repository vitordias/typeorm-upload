import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateCategorieService {
  public async execute({ title }: Request): Promise<Category> {
    const categoriesRepository = getRepository(Category);
    const category = await categoriesRepository.findOne({
      where: { title },
    });

    // Se não existe é criado uma nova categoria
    if (!category) {
      const cat = categoriesRepository.create({ title });
      await categoriesRepository.save(cat);
      return cat;
    }
    return category;
  }
}

export default CreateCategorieService;
