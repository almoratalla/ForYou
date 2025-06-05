import styles from "@/styles/components/modules/Skeleton.module.scss";
import { CSSProperties, FC, PropsWithChildren } from "react";

interface SkeletonElementProps {
    type: string;
    spec?: string;
    style?: CSSProperties;
}

const SkeletonElement: FC<PropsWithChildren<SkeletonElementProps>> = ({ type, spec, children, style }) => {
    return (
        <div className={[styles.skeleton, styles[type], styles[spec || ""]].join(" ")} style={style}>
            {children}
        </div>
    );
};

export default SkeletonElement;
