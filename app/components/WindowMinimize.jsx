import * as React from "react";

const SvgIcon = (props) => (
    <svg
        className="w-[12px] h-[12px] text-white"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3.75488 12.4995H20.2468C20.661 12.4995 20.9968 12.1637 20.9968 11.7495C20.9968 11.3353 20.661 10.9995 20.2468 10.9995H3.75488C3.34067 10.9995 3.00488 11.3353 3.00488 11.7495C3.00488 12.1637 3.34067 12.4995 3.75488 12.4995Z"
        />
    </svg>
);

export default SvgIcon;
