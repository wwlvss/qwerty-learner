import logo from '@/assets/logo.svg'
import type { PropsWithChildren } from 'react'
import type React from 'react'
import { Link, NavLink } from 'react-router-dom'

const Header: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <header className="container z-20 mx-auto w-full px-10 py-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 lg:flex-row lg:space-y-0">
        <NavLink
          className="flex items-center text-2xl font-bold text-indigo-500 no-underline hover:no-underline lg:text-4xl"
          to="https://qwerty.kaiyi.cool/"
        >
          <img src={logo} className="mr-3 h-16 w-16" alt="Qwerty Learner Logo" />
          <h1>Qwerty Learner</h1>
        </NavLink>
        <nav className="my-card on element flex w-auto content-center items-center justify-end space-x-3 rounded-xl bg-white p-4 transition-colors duration-300 dark:bg-gray-800">
          {children}
          <Link to="/roots" className="whitespace-nowrap text-sm text-indigo-500" title="打开我的词根库">
            我的词根库
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
