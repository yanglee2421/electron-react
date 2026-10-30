import { NavLink, Outlet } from "react-router";

const links = [
  {
    label: "canvas",
    path: "/canvas",
  },
  {
    label: "scanner",
    path: "/scanner",
  },
  {
    label: "lab",
    path: "/lab",
  },
];

export const Layout = () => {
  return (
    <div className="space-y-3">
      <nav className="">
        <ul className="flex gap-1">
          {links.map((i) => (
            <li
              key={i.path}
              className="flex min-w-16 items-center justify-center border"
            >
              <NavLink to={i.path}>{i.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <Outlet />
      </div>
    </div>
  );
};
