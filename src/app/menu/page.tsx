import { MenuManagement } from '@/components/menu/menu-management'
import { prisma } from '@/config/prisma'


export default async function Page() {

  const menuData = await prisma.menu.findMany()

  const menuList = menuData.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    price: parseFloat(item.price.toString()),
    isRecommend: item.is_recommended,  // Convert from is_recommended to isRecommend
    categoryId: item.category_id_id,   // Convert from category_id_id to categoryId
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }))

  return (
    <>
      <MenuManagement menuList={menuList} />
    </>
  )
}
