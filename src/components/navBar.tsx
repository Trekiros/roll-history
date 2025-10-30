import { FC, useState } from "react"
import styles from "./navBar.module.scss"
import Select from "./select"
import { Sources } from "@/pages"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBars, faBurger } from "@fortawesome/free-solid-svg-icons"

type PropType = {
    source: string,
    onSourceChange: (newValue: string) => void,

    style: "table"|"graph",
    onStyleChange: (newValue: "table"|"graph") => void,
}

export const NavBar: FC<PropType> = ({ source, onSourceChange, style, onStyleChange }) => {
    const [collapsed, setCollapsed] = useState(true)

    return (
        <div className={styles.navBar}>
            <h1>RollHistory</h1>
            
            <label>Data Source:</label>
            <Select
                className={styles.select}
                value={source} 
                options={Array.from(Object.entries(Sources)).map(([label, value]) => ({ label, value }))}
                onChange={onSourceChange} />
            
            <label>Visualization Style:</label>
            <Select
                className={styles.select}
                value={style}
                options={[{ value: "table", label: "Table" }, { value: "graph", label: "Graph" }]}
                onChange={onStyleChange} />

            <button
                className={styles.burgerBtn}
                onClick={() => setCollapsed(false)}>
                    <FontAwesomeIcon icon={faBars} />
            </button>

            <div 
                className={`${styles.collapsibleBackdrop} ${collapsed ? styles.collapsed : ''}`}
                onClick={() => setCollapsed(true)}>
                <div className={styles.sideMenu} onClick={e => e.stopPropagation()}>
                    <label>Data Source:</label>
                    <Select
                        className={styles.select}
                        value={source} 
                        options={Array.from(Object.entries(Sources)).map(([label, value]) => ({ label, value }))}
                        onChange={onSourceChange} />
                    
                    <label>Visualization Style:</label>
                    <Select
                        className={styles.select}
                        value={style}
                        options={[{ value: "table", label: "Table" }, { value: "graph", label: "Graph" }]}
                        onChange={onStyleChange} />
                </div>
            </div>
        </div>
    )
}
