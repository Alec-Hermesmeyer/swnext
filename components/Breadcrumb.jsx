import React, { Component } from 'react';
import Link from 'next/link';
import styles from '@/styles/Breadcrumb.module.css';

class Breadcrumb extends Component {
  render() {
    const { children } = this.props;
    return (
      <nav aria-label="Breadcrumb" className={styles.breadcrumbNav}>
        <ol className={styles.breadcrumbList}>
          {React.Children.map(children, (child, index) => (
            <li key={index} className={styles.breadcrumbItem}>
              {child}
              {index < React.Children.count(children) - 1 && (
                <span className={styles.breadcrumbSeparator}>/</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
}

class BreadcrumbList extends Component {
  render() {
    const { children } = this.props;
    return <>{children}</>;
  }
}

class BreadcrumbItem extends Component {
  render() {
    const { children } = this.props;
    return <>{children}</>;
  }
}

class BreadcrumbLink extends Component {
  render() {
    const { href = "/", children } = this.props;
    return (
      <Link href={href}>
        {children}
      </Link>
    );
  }
}
class DynamicBreadcrumb extends Component {
  render() {
    const { items } = this.props;
    return (
      <Breadcrumb className={styles.breadcrumb}>
        <Breadcrumb.List>
          {items.map((item, index) => (
            <Breadcrumb.Item key={index}>
              <Breadcrumb.Link href={item.href}>{item.label}</Breadcrumb.Link>
            </Breadcrumb.Item>
          ))}
        </Breadcrumb.List>
      </Breadcrumb>
    );
  }
}



// Attach subcomponents to the main Breadcrumb class component
Breadcrumb.List = BreadcrumbList;
Breadcrumb.Item = BreadcrumbItem;
Breadcrumb.Link = BreadcrumbLink;
Breadcrumb.DynamicBreadcrumb = DynamicBreadcrumb;

export default Breadcrumb;