import logo from '@/assets/logo.svg'
import { learningPreferencesAtom } from '@/features/learning-preferences/store'
import { useAtomValue } from 'jotai'
import type { PropsWithChildren } from 'react'
import type React from 'react'
import { Link, NavLink } from 'react-router-dom'

const Header: React.FC<PropsWithChildren> = ({ children }) => {
  const prefs = useAtomValue(learningPreferencesAtom)
  return (
    <header className="container z-20 mx-auto w-full px-4 py-4 sm:px-10 sm:py-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
        <NavLink className="flex items-center text-2xl font-bold text-indigo-500 no-underline hover:no-underline lg:text-4xl" to="/">
          <img src={logo} className={prefs.simpleLayout ? 'mr-3 h-10 w-10' : 'mr-3 h-16 w-16'} alt="Qwerty Learner Logo" />
          <h1 className={prefs.simpleLayout ? 'text-2xl' : ''}>{prefs.simpleLayout ? '个人英语学习' : 'Qwerty Learner'}</h1>
        </NavLink>
        <nav className="my-card on element flex w-full min-w-0 max-w-full flex-wrap content-center items-center justify-center gap-2 rounded-xl bg-white p-3 transition-colors duration-300 dark:bg-gray-800 sm:w-auto sm:justify-end sm:gap-3 sm:p-4">
          {children}
          <Link to="/my-dictionary" className="whitespace-nowrap text-sm text-indigo-500">
            我的词典
          </Link>
          <Link to="/farm" className="whitespace-nowrap text-sm text-indigo-500">
            农场英语
          </Link>
          <Link to="/unfamiliar" className="whitespace-nowrap text-sm text-indigo-500">
            不熟词本
          </Link>
          <Link to="/progress" className="whitespace-nowrap text-sm text-indigo-500">
            开发进度
          </Link>
          <Link to="/roots" className="whitespace-nowrap text-sm text-indigo-500" title="打开我的词根库">
            我的词根库
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
