import { FC, PropsWithChildren } from "react";

import styles from "@/styles/components/modules/Layout.module.scss";

import Header from "./Header";
import SideNav from "./SideNav";

const Layout: FC<PropsWithChildren> = ({ children }) => {
    return (
        <div className={styles["layout-container"]}>
            <Header />
            <div className={styles["context-container"]}>
                <SideNav />
                {children}
            </div>
        </div>
    );
};

export default Layout;
