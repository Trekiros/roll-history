import { JSX, useState } from 'react'
import ReactSelect, { ClassNamesConfig } from 'react-select'
import styles from './select.module.scss'

type PropType<T> = {
    value: T,
    options: { value: T, label: string }[],
    onChange: (newValue: T) => void,
    className?: string,
    classNames?: ClassNamesConfig,
    disabled?: boolean,
    freeEntry?: boolean,
}

const SelectStyles: ClassNamesConfig = {
    control: () => styles.control,
    input: () => styles.input,
    singleValue: () => styles.singleValue,
    menu: () => styles.menu,
    menuList: () => styles.menuList,
    option: ({ isSelected, isFocused }) => isSelected ? styles.isSelected : isFocused ? styles.isFocused : '',
    dropdownIndicator: () => styles.indicator,
    indicatorSeparator: () => styles.indicatorSeparator,
}

function getEntry<T>(options: {value: T, label: string}[], value: T) {
    const entry = options.find(option => (option.value === value))
    return entry
}

const Select = <T,>({ value, options, onChange, className, classNames, disabled, freeEntry }: PropType<T>): JSX.Element => {
    const [search, setSearch] = useState('')

    const allOptions: { value: T, label: string }[] = !freeEntry ? options : [
        ...(!!search ? [{ value: search as T, label: search }] : [{ value, label: String(value) }]),
        ...options.filter(option => (option.value !== value)), // .sort((a, b) => a.label.localeCompare(b.label)),
    ]

    return (
        <ReactSelect
            isDisabled={disabled}
            className={`${styles.select} ${className}`}
            classNames={{...SelectStyles, ...(classNames || {}) }}
            options={allOptions}
            value={(freeEntry && search) || getEntry(allOptions, value)}
            onChange={(e: any) => !e ? null : onChange(e.value)}
            onFocus={() => freeEntry && setSearch(String(value))}
            inputValue={search}
            onInputChange={(newValue) => {
                setSearch(newValue)
                if (newValue && freeEntry) onChange(newValue as T)
            }}
        />
    )
}

export default Select